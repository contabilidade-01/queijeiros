const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { validateUUID, validateEmailFormat, validateString, validateCNPJ } = require("../middleware/validate");

function adminOnly(req, res, next) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  }
  next();
}

router.use(authMiddleware);
router.use(adminOnly);

router.get("/summary", async (_req, res) => {
  try {
    const [c, d, e, cert] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS n FROM companies"),
      db.query("SELECT COUNT(*)::int AS n FROM issued_documents"),
      db.query("SELECT COUNT(*)::int AS n FROM employees"),
      db.query("SELECT COUNT(*)::int AS n FROM medical_certificates"),
    ]);
    res.json({
      companies: c.rows[0].n,
      documents: d.rows[0].n,
      employees: e.rows[0].n,
      certificates: cert.rows[0].n,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/companies", async (_req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, name, cnpj, contact_email, phone, created_at FROM companies ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

function normalizePhone(val) {
  if (val === null || val === undefined || val === "") return null;
  const d = String(val).replace(/\D/g, "");
  if (d.length < 8 || d.length > 15) return null;
  return d;
}

/** Senha inicial = CNPJ só dígitos (igual aos seeds). */
router.post("/companies", async (req, res) => {
  try {
    const { name, cnpj, contact_email, phone } = req.body;
    if (!validateString(name, 2, 200)) {
      return res.status(400).json({ error: "Nome da empresa inválido (2–200 caracteres)" });
    }
    const rawCnpj = (cnpj || "").toString();
    const cnpjDigits = rawCnpj.replace(/\D/g, "");
    if (!validateCNPJ(rawCnpj) || cnpjDigits.length !== 14) {
      return res.status(400).json({ error: "CNPJ inválido (14 dígitos)" });
    }
    let emailNorm = null;
    if (contact_email !== undefined && contact_email !== null && String(contact_email).trim()) {
      emailNorm = normalizeEmailField(contact_email);
      if (!validateEmailFormat(emailNorm)) {
        return res.status(400).json({ error: "E-mail inválido" });
      }
    }
    let phoneNorm = null;
    if (phone !== undefined && phone !== null && String(phone).trim()) {
      phoneNorm = normalizePhone(phone);
      if (!phoneNorm) {
        return res.status(400).json({ error: "Telefone inválido (mínimo 8 dígitos)" });
      }
    }
    const passwordHash = await bcrypt.hash(cnpjDigits, 10);
    const { rows } = await db.query(
      `INSERT INTO companies (name, cnpj, password_hash, contact_email, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, cnpj, contact_email, phone, created_at`,
      [name.trim(), cnpjDigits, passwordHash, emailNorm, phoneNorm]
    );
    res.status(201).json({
      company: rows[0],
      message: "Empresa criada. Login: CNPJ com ou sem máscara. Senha inicial: só os 14 dígitos do CNPJ.",
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "CNPJ já cadastrado" });
    }
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

function normalizeEmailField(val) {
  if (val === null || val === undefined || val === "") return null;
  return String(val).trim().toLowerCase();
}

router.get("/me", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, cpf, contact_email FROM platform_admins WHERE id = $1",
      [req.admin.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/me/contact-email", async (req, res) => {
  try {
    if (!Object.prototype.hasOwnProperty.call(req.body, "contact_email")) {
      return res.status(400).json({ error: "contact_email é obrigatório no corpo (use null ou \"\" para limpar)" });
    }
    const norm = normalizeEmailField(req.body.contact_email);
    if (norm && !validateEmailFormat(norm)) {
      return res.status(400).json({ error: "E-mail inválido" });
    }
    await db.query("UPDATE platform_admins SET contact_email = $1 WHERE id = $2", [
      norm,
      req.admin.id,
    ]);
    res.json({ ok: true, contact_email: norm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateUUID(id)) return res.status(400).json({ error: "ID inválido" });

    const sets = [];
    const vals = [];
    let i = 1;

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      const n = req.body.name;
      if (n === null || n === "") {
        return res.status(400).json({ error: "Nome não pode ser vazio" });
      }
      if (!validateString(n, 2, 200)) {
        return res.status(400).json({ error: "Nome inválido (2–200 caracteres)" });
      }
      sets.push(`name = $${i++}`);
      vals.push(String(n).trim());
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "contact_email")) {
      const norm = normalizeEmailField(req.body.contact_email);
      if (norm && !validateEmailFormat(norm)) {
        return res.status(400).json({ error: "E-mail inválido" });
      }
      sets.push(`contact_email = $${i++}`);
      vals.push(norm);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "phone")) {
      const p = req.body.phone === null || req.body.phone === "" ? null : normalizePhone(req.body.phone);
      if (p === null && (req.body.phone === null || req.body.phone === "")) {
        sets.push(`phone = $${i++}`);
        vals.push(null);
      } else if (!p) {
        return res.status(400).json({ error: "Telefone inválido" });
      } else {
        sets.push(`phone = $${i++}`);
        vals.push(p);
      }
    }

    if (!sets.length) {
      return res.status(400).json({ error: "Envie ao menos um campo: name, contact_email ou phone" });
    }

    vals.push(id);
    const { rows, rowCount } = await db.query(
      `UPDATE companies SET ${sets.join(", ")} WHERE id = $${i} RETURNING id, name, cnpj, contact_email, phone, created_at`,
      vals
    );
    if (!rowCount) return res.status(404).json({ error: "Empresa não encontrada" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

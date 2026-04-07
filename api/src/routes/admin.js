const router = require("express").Router();
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { validateUUID, validateEmailFormat } = require("../middleware/validate");

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
      "SELECT id, name, cnpj, contact_email, created_at FROM companies ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
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
    if (!Object.prototype.hasOwnProperty.call(req.body, "contact_email")) {
      return res.status(400).json({ error: "contact_email é obrigatório no corpo (use null ou \"\" para limpar)" });
    }
    const norm = normalizeEmailField(req.body.contact_email);
    if (norm && !validateEmailFormat(norm)) {
      return res.status(400).json({ error: "E-mail inválido" });
    }
    const { rowCount } = await db.query("UPDATE companies SET contact_email = $1 WHERE id = $2", [
      norm,
      id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Empresa não encontrada" });
    res.json({ ok: true, contact_email: norm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

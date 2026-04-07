const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../db");
const { generateToken, generateAdminToken } = require("../middleware/auth");
const { validateCNPJ, validateString, validateCPF } = require("../middleware/validate");

router.post("/login", async (req, res) => {
  try {
    const raw = (req.body.login || req.body.cnpj || "").toString();
    const { password } = req.body;

    if (!raw || !validateString(password, 1, 128)) {
      return res.status(400).json({ error: "Login e senha obrigatórios" });
    }

    const clean = raw.replace(/\D/g, "");

    // Administrador: CPF 11 dígitos (tabela platform_admins)
    if (clean.length === 11) {
      if (!validateCPF(raw)) {
        return res.status(400).json({ error: "CPF inválido" });
      }
      const { rows } = await db.query(
        "SELECT id, cpf, password_hash FROM platform_admins WHERE cpf = $1",
        [clean]
      );
      if (!rows.length) return res.status(401).json({ error: "Acesso não encontrado" });
      const adm = rows[0];
      const ok = await bcrypt.compare(password, adm.password_hash);
      if (!ok) return res.status(401).json({ error: "Senha incorreta" });
      const token = generateAdminToken({ id: adm.id, cpf: adm.cpf });
      return res.json({
        token,
        role: "admin",
        admin: { id: adm.id, cpf: adm.cpf },
      });
    }

    // Empresa: CNPJ 14 dígitos
    if (clean.length === 14) {
      if (!validateCNPJ(raw)) {
        return res.status(400).json({ error: "CNPJ inválido" });
      }
      const { rows } = await db.query(
        "SELECT id, name, cnpj, password_hash FROM companies WHERE cnpj = $1",
        [clean]
      );
      if (!rows.length) return res.status(401).json({ error: "Empresa não encontrada" });
      const company = rows[0];
      const valid = await bcrypt.compare(password, company.password_hash);
      if (!valid) return res.status(401).json({ error: "Senha incorreta" });
      const token = generateToken({
        company_id: company.id,
        company_name: company.name,
        company_cnpj: company.cnpj,
      });
      return res.json({
        token,
        role: "company",
        company: { id: company.id, name: company.name, cnpj: company.cnpj },
      });
    }

    return res.status(400).json({
      error: "Informe CNPJ da empresa (14 dígitos) ou CPF do administrador (11 dígitos)",
    });
  } catch (err) {
    console.error("Login error:", err.message, err.code || "");
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

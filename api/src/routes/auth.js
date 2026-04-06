const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../db");

router.post("/login", async (req, res) => {
  try {
    const { cnpj, password } = req.body;
    const clean = cnpj.replace(/\D/g, "");

    const { rows } = await db.query(
      "SELECT id, name, cnpj, password_hash FROM companies WHERE cnpj = $1",
      [clean]
    );

    if (!rows.length) return res.status(401).json({ error: "Empresa não encontrada" });

    const company = rows[0];
    const valid = await bcrypt.compare(password, company.password_hash);
    if (!valid) return res.status(401).json({ error: "Senha incorreta" });

    res.json({
      company: { id: company.id, name: company.name, cnpj: company.cnpj },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

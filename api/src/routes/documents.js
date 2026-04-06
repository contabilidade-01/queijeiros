const router = require("express").Router();
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { validateString, validateUUID, validateDate } = require("../middleware/validate");

router.use(authMiddleware);

const ALLOWED_DOC_TYPES = ["advertencia", "suspensao"];

router.get("/", async (req, res) => {
  try {
    const companyId = req.company.id;
    const { rows } = await db.query(
      "SELECT * FROM issued_documents WHERE company_id = $1 ORDER BY created_at DESC",
      [companyId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/", async (req, res) => {
  try {
    const companyId = req.company.id;
    const d = req.body;

    if (!d.document_type || !ALLOWED_DOC_TYPES.includes(d.document_type)) {
      return res.status(400).json({ error: "Tipo de documento inválido" });
    }
    if (!validateString(d.employee_name, 2, 200)) {
      return res.status(400).json({ error: "Nome do funcionário inválido" });
    }
    if (!validateString(d.employee_cpf, 11, 14)) {
      return res.status(400).json({ error: "CPF do funcionário inválido" });
    }
    if (d.start_date && !validateDate(d.start_date)) {
      return res.status(400).json({ error: "Data de início inválida" });
    }
    if (d.description && !validateString(d.description, 1, 2000)) {
      return res.status(400).json({ error: "Descrição muito longa (máx 2000 caracteres)" });
    }

    const { rows } = await db.query(
      `INSERT INTO issued_documents 
        (document_type, employee_name, employee_cpf, employee_pis, company_name, company_cnpj, company_id, start_date, suspension_days, return_date, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [d.document_type, d.employee_name.trim(), d.employee_cpf.replace(/\D/g, ""),
       d.employee_pis || null, req.company.name, req.company.cnpj, companyId,
       d.start_date || null, d.suspension_days || null, d.return_date || null, d.description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const companyId = req.company.id;
    if (!validateUUID(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const { rowCount } = await db.query(
      "DELETE FROM issued_documents WHERE id=$1 AND company_id=$2",
      [req.params.id, companyId]
    );
    if (!rowCount) return res.status(404).json({ error: "Documento não encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

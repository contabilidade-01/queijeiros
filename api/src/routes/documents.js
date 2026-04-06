const router = require("express").Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: "company_id obrigatório" });
    const { rows } = await db.query(
      "SELECT * FROM issued_documents WHERE company_id = $1 ORDER BY created_at DESC",
      [company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/", async (req, res) => {
  try {
    const d = req.body;
    const { rows } = await db.query(
      `INSERT INTO issued_documents 
        (document_type, employee_name, employee_cpf, employee_pis, company_name, company_cnpj, company_id, start_date, suspension_days, return_date, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [d.document_type, d.employee_name, d.employee_cpf, d.employee_pis || null,
       d.company_name, d.company_cnpj, d.company_id || null,
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
    await db.query("DELETE FROM issued_documents WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

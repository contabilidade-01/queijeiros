const router = require("express").Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: "company_id obrigatório" });
    const { rows } = await db.query(
      "SELECT * FROM employees WHERE company_id = $1 ORDER BY name",
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
    const { company_id, name, cpf, pis } = req.body;
    const { rows } = await db.query(
      "INSERT INTO employees (company_id, name, cpf, pis) VALUES ($1,$2,$3,$4) RETURNING *",
      [company_id, name, cpf.replace(/\D/g, ""), pis || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, cpf, pis, active } = req.body;
    const sets = [];
    const vals = [];
    let i = 1;
    if (name !== undefined) { sets.push(`name=$${i++}`); vals.push(name); }
    if (cpf !== undefined) { sets.push(`cpf=$${i++}`); vals.push(cpf.replace(/\D/g, "")); }
    if (pis !== undefined) { sets.push(`pis=$${i++}`); vals.push(pis); }
    if (active !== undefined) { sets.push(`active=$${i++}`); vals.push(active); }
    vals.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE employees SET ${sets.join(",")} WHERE id=$${i} RETURNING *`,
      vals
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM employees WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

const router = require("express").Router();
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { validateCPF, validateString, validateUUID } = require("../middleware/validate");

// All routes require auth
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    // company_id comes from JWT, not query params
    const companyId = req.company.id;
    const { rows } = await db.query(
      "SELECT * FROM employees WHERE company_id = $1 ORDER BY name",
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
    const { name, cpf, pis } = req.body;

    if (!name || !validateString(name, 2, 200)) {
      return res.status(400).json({ error: "Nome inválido (2-200 caracteres)" });
    }
    if (!cpf || !validateCPF(cpf)) {
      return res.status(400).json({ error: "CPF inválido (11 dígitos)" });
    }
    if (pis && !validateString(pis, 1, 20)) {
      return res.status(400).json({ error: "PIS inválido" });
    }

    const { rows } = await db.query(
      "INSERT INTO employees (company_id, name, cpf, pis) VALUES ($1,$2,$3,$4) RETURNING *",
      [companyId, name.trim(), cpf.replace(/\D/g, ""), pis || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const companyId = req.company.id;
    if (!validateUUID(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { name, cpf, pis, active } = req.body;
    const sets = [];
    const vals = [];
    let i = 1;
    if (name !== undefined) {
      if (!validateString(name, 2, 200)) return res.status(400).json({ error: "Nome inválido" });
      sets.push(`name=$${i++}`); vals.push(name.trim());
    }
    if (cpf !== undefined) {
      if (!validateCPF(cpf)) return res.status(400).json({ error: "CPF inválido" });
      sets.push(`cpf=$${i++}`); vals.push(cpf.replace(/\D/g, ""));
    }
    if (pis !== undefined) { sets.push(`pis=$${i++}`); vals.push(pis); }
    if (active !== undefined) { sets.push(`active=$${i++}`); vals.push(active); }

    if (!sets.length) return res.status(400).json({ error: "Nenhum campo para atualizar" });

    // Ensure employee belongs to this company
    vals.push(req.params.id);
    vals.push(companyId);
    const { rows } = await db.query(
      `UPDATE employees SET ${sets.join(",")} WHERE id=$${i} AND company_id=$${i + 1} RETURNING *`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: "Funcionário não encontrado" });
    res.json(rows[0]);
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
      "DELETE FROM employees WHERE id=$1 AND company_id=$2",
      [req.params.id, companyId]
    );
    if (!rowCount) return res.status(404).json({ error: "Funcionário não encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

const router = require("express").Router();
const db = require("../db");
const { authMiddleware, requireCompanyUser } = require("../middleware/auth");
const { validateCPF, validateString, validateUUID } = require("../middleware/validate");

// All routes require auth
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    if (req.isAdmin) {
      const { rows } = await db.query(
        `SELECT e.*, c.name AS company_name, c.cnpj AS company_cnpj
         FROM employees e
         JOIN companies c ON c.id = e.company_id
         ORDER BY c.name, e.name`
      );
      return res.json(rows);
    }
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

router.post("/", requireCompanyUser, async (req, res) => {
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

router.post("/import", requireCompanyUser, async (req, res) => {
  const companyId = req.company.id;
  const companyCnpj = (req.company.cnpj || "").replace(/\D/g, "");
  const fileCnpj = (req.body?.fileCnpj || "").toString().replace(/\D/g, "");
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

  if (!fileCnpj || fileCnpj.length !== 14) {
    return res.status(400).json({ error: "CNPJ do arquivo não identificado" });
  }
  if (fileCnpj !== companyCnpj) {
    return res.status(403).json({ error: "CNPJ do arquivo não corresponde à empresa logada" });
  }
  if (!rows.length) {
    return res.status(400).json({ error: "Nenhum funcionário enviado para importação" });
  }
  if (rows.length > 1000) {
    return res.status(400).json({ error: "Limite de 1000 funcionários por importação" });
  }

  const client = await db.connect();
  let inserted = 0;
  let skipped = 0;
  const errors = [];

  try {
    await client.query("BEGIN");

    for (let idx = 0; idx < rows.length; idx += 1) {
      const item = rows[idx] || {};
      const name = (item.name || "").toString().trim().toUpperCase();
      const cpfRaw = (item.cpf || "").toString();
      const cpf = cpfRaw.replace(/\D/g, "");
      const pis = item.pis ? item.pis.toString().replace(/\D/g, "") : null;

      if (!validateString(name, 2, 200) || !validateCPF(cpf)) {
        errors.push({ row: idx + 1, message: "Nome/CPF inválido" });
        continue;
      }
      if (pis && !validateString(pis, 1, 20)) {
        errors.push({ row: idx + 1, message: "PIS inválido" });
        continue;
      }
      if (item.active === false) {
        skipped += 1;
        continue;
      }

      const exists = await client.query(
        "SELECT 1 FROM employees WHERE company_id = $1 AND cpf = $2 LIMIT 1",
        [companyId, cpf]
      );
      if (exists.rowCount) {
        skipped += 1;
        continue;
      }

      await client.query(
        "INSERT INTO employees (company_id, name, cpf, pis, active) VALUES ($1, $2, $3, $4, true)",
        [companyId, name, cpf, pis]
      );
      inserted += 1;
    }

    await client.query("COMMIT");
    return res.status(201).json({ inserted, skipped, errors });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao importar funcionários" });
  } finally {
    client.release();
  }
});

router.put("/:id", async (req, res) => {
  try {
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

    if (req.isAdmin) {
      vals.push(req.params.id);
      const { rows } = await db.query(
        `UPDATE employees SET ${sets.join(",")} WHERE id=$${i} RETURNING *`,
        vals
      );
      if (!rows.length) return res.status(404).json({ error: "Funcionário não encontrado" });
      return res.json(rows[0]);
    }

    const companyId = req.company.id;
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
    if (!validateUUID(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    if (req.isAdmin) {
      const { rowCount } = await db.query("DELETE FROM employees WHERE id=$1", [req.params.id]);
      if (!rowCount) return res.status(404).json({ error: "Funcionário não encontrado" });
      return res.json({ ok: true });
    }
    const companyId = req.company.id;
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

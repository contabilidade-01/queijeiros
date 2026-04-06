const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/", async (req, res) => {
  try {
    const { company_id, start_date, end_date } = req.query;
    if (!company_id) return res.status(400).json({ error: "company_id obrigatório" });

    let sql = `SELECT mc.*, e.name as employee_name 
               FROM medical_certificates mc 
               JOIN employees e ON mc.employee_id = e.id 
               WHERE mc.company_id = $1`;
    const params = [company_id];

    if (start_date) { params.push(start_date); sql += ` AND mc.certificate_date >= $${params.length}`; }
    if (end_date) { params.push(end_date); sql += ` AND mc.certificate_date <= $${params.length}`; }

    sql += " ORDER BY mc.certificate_date DESC";
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { company_id, employee_id, certificate_date, notes } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Arquivo obrigatório" });

    const { rows } = await db.query(
      `INSERT INTO medical_certificates (company_id, employee_id, file_path, file_name, certificate_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [company_id, employee_id, file.filename, file.originalname, certificate_date || new Date().toISOString().slice(0, 10), notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/file/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Arquivo não encontrado" });
  res.sendFile(filePath);
});

router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await db.query("DELETE FROM medical_certificates WHERE id=$1 RETURNING file_path", [req.params.id]);
    if (rows[0]?.file_path) {
      const fp = path.join(UPLOAD_DIR, rows[0].file_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

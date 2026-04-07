require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/certificates", require("./routes/certificates"));

// Health: confirma ligação ao Postgres (útil em deploy)
app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "up" });
  } catch (err) {
    console.error("Health DB check:", err.message);
    res.status(503).json({
      status: "error",
      database: "down",
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));

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
app.use("/api/admin", require("./routes/admin"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/certificates", require("./routes/certificates"));

// Health: sempre HTTP 200 para o healthcheck do Docker / proxy não derrubar o contentor.
// Estado da BD vai no JSON (use database: "down" para diagnosticar login 500).
app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "up" });
  } catch (err) {
    console.error("Health DB check:", err.message);
    res.status(200).json({
      status: "ok",
      database: "down",
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));

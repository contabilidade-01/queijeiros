const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { generateToken, generateAdminToken } = require("../middleware/auth");
const {
  validateCNPJ,
  validateString,
  validateCPF,
  validateEmailFormat,
} = require("../middleware/validate");
const { isSmtpConfigured, getPublicAppUrl, sendPasswordResetEmail } = require("../mailer");

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_FORGOT_PASSWORD_MAX || 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_RESET_PASSWORD_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

const resetTokenCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

function normalizeEmail(val) {
  if (val == null) return "";
  return String(val).trim().toLowerCase();
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

const GENERIC_FORGOT_MSG =
  "Se os dados estiverem corretos e houver e-mail cadastrado, você receberá um link em instantes.";

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

router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const rawLogin = (req.body.login || req.body.cnpj || req.body.cpf || "").toString();
    const emailRaw = req.body.email;
    if (!rawLogin || !validateString(emailRaw, 3, 254) || !validateEmailFormat(emailRaw)) {
      return res.status(400).json({ error: "Informe login (CNPJ ou CPF) e um e-mail válido" });
    }
    if (!isSmtpConfigured()) {
      return res.status(503).json({
        error: "Recuperação por e-mail não está configurada. Contacte o suporte.",
      });
    }
    const publicUrl = getPublicAppUrl();
    if (!publicUrl) {
      console.error("PUBLIC_APP_URL não definido — link de recuperação inválido");
      return res.status(503).json({ error: "Configuração incompleta do servidor." });
    }

    const clean = rawLogin.replace(/\D/g, "");
    const emailNorm = normalizeEmail(emailRaw);

    let companyId = null;
    let adminId = null;
    let emailOnRecord = null;

    if (clean.length === 11) {
      if (!validateCPF(rawLogin)) {
        return res.json({ message: GENERIC_FORGOT_MSG });
      }
      const { rows } = await db.query(
        "SELECT id, contact_email FROM platform_admins WHERE cpf = $1",
        [clean]
      );
      if (!rows.length || !rows[0].contact_email) {
        return res.json({ message: GENERIC_FORGOT_MSG });
      }
      if (normalizeEmail(rows[0].contact_email) !== emailNorm) {
        return res.json({ message: GENERIC_FORGOT_MSG });
      }
      adminId = rows[0].id;
      emailOnRecord = rows[0].contact_email;
    } else if (clean.length === 14) {
      if (!validateCNPJ(rawLogin)) {
        return res.json({ message: GENERIC_FORGOT_MSG });
      }
      const { rows } = await db.query(
        "SELECT id, contact_email FROM companies WHERE cnpj = $1",
        [clean]
      );
      if (!rows.length || !rows[0].contact_email) {
        return res.json({ message: GENERIC_FORGOT_MSG });
      }
      if (normalizeEmail(rows[0].contact_email) !== emailNorm) {
        return res.json({ message: GENERIC_FORGOT_MSG });
      }
      companyId = rows[0].id;
      emailOnRecord = rows[0].contact_email;
    } else {
      return res.status(400).json({
        error: "Login deve ser CNPJ (empresa) ou CPF (administrador)",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const ttlMin = Math.min(
      Math.max(parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES || "60", 10), 5),
      24 * 7
    );
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      if (companyId) {
        await client.query(
          "DELETE FROM password_reset_tokens WHERE company_id = $1 AND used_at IS NULL",
          [companyId]
        );
        await client.query(
          `INSERT INTO password_reset_tokens (token_hash, expires_at, company_id)
           VALUES ($1, $2, $3)`,
          [tokenHash, expiresAt, companyId]
        );
      } else {
        await client.query("DELETE FROM password_reset_tokens WHERE admin_id = $1 AND used_at IS NULL", [
          adminId,
        ]);
        await client.query(
          `INSERT INTO password_reset_tokens (token_hash, expires_at, admin_id)
           VALUES ($1, $2, $3)`,
          [tokenHash, expiresAt, adminId]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }

    const resetUrl = `${publicUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail({ to: emailOnRecord.trim(), resetUrl });
    } catch (err) {
      console.error("sendPasswordResetEmail:", err.message);
      await db.query("DELETE FROM password_reset_tokens WHERE token_hash = $1", [tokenHash]);
      return res.status(502).json({
        error: "Não foi possível enviar o e-mail. Tente novamente mais tarde.",
      });
    }

    return res.json({ message: GENERIC_FORGOT_MSG });
  } catch (err) {
    console.error("forgot-password:", err.message);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/reset-token", resetTokenCheckLimiter, async (req, res) => {
  try {
    const token = (req.query.token || "").toString();
    if (!validateString(token, 32, 128)) {
      return res.json({ valid: false });
    }
    const tokenHash = hashToken(token);
    const { rows } = await db.query(
      `SELECT id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
      [tokenHash]
    );
    res.json({ valid: rows.length > 0 });
  } catch (err) {
    console.error("reset-token:", err.message);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/reset-password", resetPasswordLimiter, async (req, res) => {
  try {
    const token = (req.body.token || "").toString();
    const password = req.body.password;
    if (!validateString(token, 32, 128) || !validateString(password, 8, 128)) {
      return res.status(400).json({
        error: "Token inválido ou senha muito curta (mínimo 8 caracteres)",
      });
    }
    const tokenHash = hashToken(token);
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `SELECT id, company_id, admin_id FROM password_reset_tokens
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
         FOR UPDATE`,
        [tokenHash]
      );
      if (!rows.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Link inválido ou expirado. Solicite um novo." });
      }
      const row = rows[0];
      const passwordHash = await bcrypt.hash(password, 10);
      if (row.company_id) {
        await client.query("UPDATE companies SET password_hash = $1 WHERE id = $2", [
          passwordHash,
          row.company_id,
        ]);
      } else {
        await client.query("UPDATE platform_admins SET password_hash = $1 WHERE id = $2", [
          passwordHash,
          row.admin_id,
        ]);
      }
      await client.query("UPDATE password_reset_tokens SET used_at = now() WHERE id = $1", [row.id]);
      await client.query("COMMIT");
      res.json({ message: "Senha atualizada. Você já pode entrar." });
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("reset-password:", err.message);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;

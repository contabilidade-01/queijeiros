const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const JWT_EXPIRES = "8h";

/** JWT de empresa (CNPJ) */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/** JWT de administrador (CPF na tabela platform_admins) */
function generateAdminToken(admin) {
  return jwt.sign(
    { role: "admin", admin_id: admin.id, admin_cpf: admin.cpf },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === "admin") {
      req.isAdmin = true;
      req.admin = { id: decoded.admin_id, cpf: decoded.admin_cpf || "" };
      req.company = null;
    } else if (decoded.company_id) {
      req.isAdmin = false;
      req.admin = null;
      req.company = {
        id: decoded.company_id,
        name: decoded.company_name,
        cnpj: decoded.company_cnpj,
      };
    } else {
      return res.status(401).json({ error: "Token inválido" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

/** Rotas de cadastro/emitir documento: só empresa, não admin */
function requireCompanyUser(req, res, next) {
  if (req.isAdmin || !req.company?.id) {
    return res.status(403).json({ error: "Recurso exclusivo para login de empresa" });
  }
  next();
}

module.exports = { generateToken, generateAdminToken, authMiddleware, requireCompanyUser, JWT_SECRET };

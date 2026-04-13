/**
 * Permissões por empresa: cada chave liga/desliga o acesso à ferramenta no app.
 * Valores omitidos no JSON gravado na BD são tratados como true (retrocompatível).
 */
const DEFAULT_TOOL_ACCESS = {
  suspension: true,
  warning: true,
  chatbot: true,
  salary_adhoc: true,
  employees: true,
  certificates: true,
  history: true,
};

function mergeToolAccess(raw) {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const out = { ...DEFAULT_TOOL_ACCESS };
  for (const key of Object.keys(DEFAULT_TOOL_ACCESS)) {
    if (Object.prototype.hasOwnProperty.call(o, key)) {
      out[key] = Boolean(o[key]);
    }
  }
  return out;
}

function normalizeToolAccessPatch(body) {
  if (body === null || body === undefined || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  const patch = {};
  for (const key of Object.keys(DEFAULT_TOOL_ACCESS)) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      patch[key] = Boolean(body[key]);
    }
  }
  return Object.keys(patch).length ? patch : null;
}

module.exports = {
  DEFAULT_TOOL_ACCESS,
  mergeToolAccess,
  normalizeToolAccessPatch,
};

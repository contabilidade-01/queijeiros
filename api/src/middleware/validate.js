function validateCPF(cpf) {
  const clean = (cpf || "").replace(/\D/g, "");
  return clean.length === 11;
}

function validateCNPJ(cnpj) {
  const clean = (cnpj || "").replace(/\D/g, "");
  return clean.length === 14;
}

function validateString(val, minLen = 1, maxLen = 255) {
  return typeof val === "string" && val.trim().length >= minLen && val.trim().length <= maxLen;
}

function validateUUID(val) {
  return typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function validateDate(val) {
  if (!val) return true; // optional
  return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));
}

module.exports = { validateCPF, validateCNPJ, validateString, validateUUID, validateDate };

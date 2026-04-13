/**
 * Garante coluna de permissões por ferramenta (empresas já existentes recebem o default JSON).
 */
async function ensureToolAccessSchema(db) {
  try {
    await db.query(`
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS tool_access JSONB
        DEFAULT '{"suspension":true,"warning":true,"chatbot":true,"salary_adhoc":true,"employees":true,"certificates":true,"history":true}'::jsonb;
    `);
    await db.query(`
      UPDATE companies
      SET tool_access = '{"suspension":true,"warning":true,"chatbot":true,"salary_adhoc":true,"employees":true,"certificates":true,"history":true}'::jsonb
      WHERE tool_access IS NULL;
    `);
    console.log("[DB] tool_access: coluna verificada/atualizada.");
  } catch (err) {
    console.error("[DB] ensureToolAccessSchema falhou:", err.message, err.code || "");
    throw err;
  }
}

module.exports = { ensureToolAccessSchema };

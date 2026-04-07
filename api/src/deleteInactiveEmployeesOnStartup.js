/**
 * A cada arranque da API (inclui cada redeploy no Easypanel), remove funcionários
 * com active = false (ou NULL). Idempotente: sem inativos, não altera nada.
 * Atestados ligados apagam-se em cascata (FK em medical_certificates).
 */
async function deleteInactiveEmployeesOnStartup(db) {
  const { rowCount } = await db.query(
    "DELETE FROM employees WHERE active IS NOT TRUE"
  );
  if (rowCount > 0) {
    console.log(`DB maintenance: removed ${rowCount} inactive employee(s)`);
  }
}

module.exports = { deleteInactiveEmployeesOnStartup };

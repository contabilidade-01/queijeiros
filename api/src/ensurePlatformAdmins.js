/**
 * Bases criadas antes de platform_admins não repetem init.sql.
 * Garante tabela + utilizador admin padrão no arranque da API (idempotente).
 *
 * Login admin: CPF só dígitos 05487541523 (pode usar máscara no front).
 * Senha inicial padrão (hash abaixo): **35736034000123** — igual ao CNPJ da empresa
 * seed "Gestão Empresa" em db/init.sql; NÃO é o próprio CPF do admin.
 * Altere após o primeiro acesso (recuperação de senha com e-mail em platform_admins).
 */
const ADMIN_CPF = "05487541523";
// bcrypt cost 10 — plaintext = 35736034000123 (ver comentário acima)
const ADMIN_PASSWORD_HASH =
  "$2a$10$P0E31oAGRjfkNOUZrd5.K..Wch43XC1WcK3HLiSYOQVK6DBlUbSaW";

async function ensurePlatformAdmins(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS platform_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cpf TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await db.query(
    `INSERT INTO platform_admins (cpf, password_hash) VALUES ($1, $2)
     ON CONFLICT (cpf) DO NOTHING`,
    [ADMIN_CPF, ADMIN_PASSWORD_HASH]
  );
}

module.exports = { ensurePlatformAdmins };

-- Correr UMA VEZ no Postgres se a API mostrar:
--   "password authentication failed for user \"rhapp\""
-- Isto acontece quando se mudou DB_PASSWORD no Easypanel mas o volume já existia
-- com outra palavra-passe. O valor abaixo deve ser IGUAL a DB_PASSWORD no painel.
--
-- Easypanel: consola do contentor postgres → psql -U rhapp -d rhapp (ou -U postgres se disponível)
-- ou: docker exec -it gestao-docs_app-postgres-1 psql -U rhapp -d rhapp
--
-- Depois colar (ajustar a palavra-passe se mudares no painel):
ALTER USER rhapp WITH PASSWORD '35736034000123';

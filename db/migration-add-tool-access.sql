-- Permissões por ferramenta (executar uma vez em bases já existentes, ou confiar no ensureToolAccessSchema na API)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tool_access JSONB
  DEFAULT '{"suspension":true,"warning":true,"chatbot":true,"salary_adhoc":true,"employees":true,"certificates":true,"history":true}'::jsonb;

UPDATE companies
SET tool_access = '{"suspension":true,"warning":true,"chatbot":true,"salary_adhoc":true,"employees":true,"certificates":true,"history":true}'::jsonb
WHERE tool_access IS NULL;

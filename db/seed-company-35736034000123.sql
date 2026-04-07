-- Correr no Postgres se a BD já existir mas faltar a empresa de login 35736034000123 / senha igual ao CNPJ
-- (o init.sql completo só corre na primeira criação do volume)
INSERT INTO companies (name, cnpj, password_hash) VALUES (
  'Gestão Empresa',
  '35736034000123',
  '$2a$10$4IXJRYObvEzVNQutX51uq.uuQBbijm.k1zfVnLNY2hSSL8aDjPH4a'
) ON CONFLICT (cnpj) DO NOTHING;

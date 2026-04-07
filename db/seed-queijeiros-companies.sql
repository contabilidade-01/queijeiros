-- Executar manualmente em bases já existentes (volume antigo):
-- docker compose exec -T postgres psql -U rhapp -d rhapp < db/seed-queijeiros-companies.sql

INSERT INTO companies (name, cnpj, password_hash) VALUES (
  'RESTAURANTE DO QUEIJEIRO 3 LIMITADA',
  '52191264000173',
  '$2a$10$5faaPl2KUgL2HkTo0a2FPOOdHG7wBjhiVE8z.XaJA9SF8HvYUAjJq'
) ON CONFLICT (cnpj) DO UPDATE
SET name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash;

INSERT INTO companies (name, cnpj, password_hash) VALUES (
  'RESTAURANTE DO QUEIJEIRO 4 LTDA',
  '54803962000108',
  '$2a$10$LMyi3tOwE.FOi0nn8Q1Qz.NNN40Su8LSWVuBgu7AlQipQ7MoaVviG'
) ON CONFLICT (cnpj) DO UPDATE
SET name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash;

-- Schema initialization for self-hosted PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  pis TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issued_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('suspension', 'warning')),
  employee_name TEXT NOT NULL,
  employee_cpf TEXT NOT NULL,
  employee_pis TEXT,
  company_name TEXT NOT NULL,
  company_cnpj TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  start_date DATE,
  suspension_days INTEGER,
  return_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medical_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  certificate_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seeds (login: CNPJ com/sem máscara; senha = CNPJ só dígitos).
INSERT INTO companies (name, cnpj, password_hash) VALUES (
  'Checkar Segurança do App',
  '26786637000149',
  '$2a$10$Vh//AwQ4LXwzBNsaItK2vOljW9D4M2rYY8sN9c8MFlrvx5max0HYm'
) ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO companies (name, cnpj, password_hash) VALUES (
  'RESTAURANTE DO QUEIJEIRO 3 LIMITADA',
  '52191264000173',
  '$2a$10$5faaPl2KUgL2HkTo0a2FPOOdHG7wBjhiVE8z.XaJA9SF8HvYUAjJq'
) ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO companies (name, cnpj, password_hash) VALUES (
  'RESTAURANTE DO QUEIJEIRO 4 LTDA',
  '54803962000108',
  '$2a$10$LMyi3tOwE.FOi0nn8Q1Qz.NNN40Su8LSWVuBgu7AlQipQ7MoaVviG'
) ON CONFLICT (cnpj) DO NOTHING;

-- Empresa operacional (senha de login = CNPJ, alinhada a um DB_PASSWORD de exemplo em produção)
INSERT INTO companies (name, cnpj, password_hash) VALUES (
  'Gestão Empresa',
  '35736034000123',
  '$2a$10$4IXJRYObvEzVNQutX51uq.uuQBbijm.k1zfVnLNY2hSSL8aDjPH4a'
) ON CONFLICT (cnpj) DO NOTHING;

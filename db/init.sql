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
  document_type TEXT NOT NULL,
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

-- Seed: empresa padrão (senha: 26786637000149)
-- Hash gerado com bcrypt cost 10
INSERT INTO companies (name, cnpj, password_hash) VALUES (
  'Checkar Segurança do App',
  '26786637000149',
  '$2a$10$8K1p/a5r6VFH5vTqVU0KOeJ3bO0nBqQGzCm5G7Yv5QGq1jZ3K1Xhm'
) ON CONFLICT (cnpj) DO NOTHING;

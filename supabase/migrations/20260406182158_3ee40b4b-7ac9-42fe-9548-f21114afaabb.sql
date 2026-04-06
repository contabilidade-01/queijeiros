
-- Add password_hash column
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS password_hash text;

-- Hash existing plaintext passwords with bcrypt using extensions schema
UPDATE public.companies SET password_hash = extensions.crypt(password, extensions.gen_salt('bf', 10));

-- Drop old permissive SELECT policy on companies
DROP POLICY IF EXISTS "Anyone can read companies" ON public.companies;

-- Create public view without sensitive columns
CREATE OR REPLACE VIEW public.companies_public AS
SELECT id, name, cnpj FROM public.companies;

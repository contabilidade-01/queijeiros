
-- Table to store issued documents (suspensions and warnings)
CREATE TABLE public.issued_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL CHECK (document_type IN ('suspension', 'warning')),
  employee_name TEXT NOT NULL,
  employee_cpf TEXT NOT NULL,
  employee_pis TEXT,
  company_name TEXT NOT NULL,
  company_cnpj TEXT NOT NULL,
  start_date DATE,
  suspension_days INTEGER,
  return_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.issued_documents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and insert (no auth required for this simple system)
CREATE POLICY "Anyone can view documents" ON public.issued_documents FOR SELECT USING (true);
CREATE POLICY "Anyone can insert documents" ON public.issued_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete documents" ON public.issued_documents FOR DELETE USING (true);


-- Create storage bucket for medical certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('atestados', 'atestados', true);

-- Create medical_certificates table
CREATE TABLE public.medical_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  certificate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;

-- RLS policies (public access like other tables in this app)
CREATE POLICY "Anyone can read certificates" ON public.medical_certificates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert certificates" ON public.medical_certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update certificates" ON public.medical_certificates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete certificates" ON public.medical_certificates FOR DELETE USING (true);

-- Storage RLS policies
CREATE POLICY "Anyone can upload atestados" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'atestados');
CREATE POLICY "Anyone can read atestados" ON storage.objects FOR SELECT USING (bucket_id = 'atestados');
CREATE POLICY "Anyone can delete atestados" ON storage.objects FOR DELETE USING (bucket_id = 'atestados');

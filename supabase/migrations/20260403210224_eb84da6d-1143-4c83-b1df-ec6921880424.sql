
-- Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read companies" ON public.companies FOR SELECT TO public USING (true);

-- Employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  cpf text NOT NULL,
  pis text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read employees" ON public.employees FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert employees" ON public.employees FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update employees" ON public.employees FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete employees" ON public.employees FOR DELETE TO public USING (true);

-- Add company_id to issued_documents
ALTER TABLE public.issued_documents ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Add update policy to issued_documents
CREATE POLICY "Anyone can update documents" ON public.issued_documents FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Insert the 3 companies
INSERT INTO public.companies (name, cnpj, password) VALUES
  ('RESTAURANTE DO QUEIJEIRO LTDA', '26.786.637/0001-49', '26786637000149'),
  ('RESTAURANTE DO QUEIJEIRO 3 LIMITADA', '52.191.264/0001-73', '52191264000173'),
  ('RESTAURANTE DO QUEIJEIRO 4 LTDA', '54.803.962/0001-08', '54803962000108');

-- Insert employees for Q1
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'CLEUNICE FERREIRA DA SILVA', '274.276.878-50' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'GISELE DA CONCEICAO', '399.922.048-18' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'BEATRIZ ALVES PEREIRA', '519.989.538-90' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'EDUARDO ANDRADE NOGUEIRA', '166.949.778-08' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'JANAINA APARECIDA LADISLAU DIAS', '360.294.708-41' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'BRUNO MICHEL DOS SANTOS FERREIRA', '230.636.008-14' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'JAQUELINE SILVA DOS SANTOS', '369.342.218-42' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'CECILIA DOMINGAS DA SILVA', '259.460.198-56' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'ELANE BENIGNO DE SOUSA', '049.774.805-38' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'RAQUEL REGIANE BULGARELLI BARBOSA', '362.787.038-74' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'INGRID JESUS NICACIO DE LIMA', '387.964.278-84' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'TAULANE ELEN DE JESUS DIAS', '065.272.735-25' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'NATASHA CRISTINA PANTA', '503.817.398-56' FROM public.companies WHERE cnpj = '26.786.637/0001-49';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'GUILHERME PEREIRA DA SILVA ALMEIDA', '493.912.108-99' FROM public.companies WHERE cnpj = '26.786.637/0001-49';

-- Insert employees for Q3
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'SERVILA DIAS BENIGNA', '821.996.635-15' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'DANIELA ADAMOLI VILAR PRIETO EVANGELISTA', '304.453.638-35' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'MARIA DE FATIMA FERREIRA DE ARAUJO', '061.362.608-75' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'FRANCINE RAFAELI ESTEVES', '428.450.438-05' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'FLAVIA MORAES DE GOIS', '347.629.878-75' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'OTAVIO DOS SANTOS DE OLIVEIRA', '510.493.598-10' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'RAIANE VITORIA SOUZA DE OLIVEIRA', '581.434.898-41' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'MARCOS FERNANDO MOREIRA DO CARMO', '300.433.708-88' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'CLEOMILDA DE JESUS SANTOS', '319.902.708-32' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'CHARLINHO NAZARIO DA SILVA', '049.487.895-93' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'GRAZIELI BARBOSA CARREIRA', '546.221.768-40' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'JEFFERSON ROSA DE SOUZA', '412.091.828-90' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'MARICELIA DE SOUZA SANTOS', '529.680.225-04' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'MARIA CRISTINA BIONE', '802.642.634-72' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'JULIA HELLEN GONCALVES OZELANI FERREIRA', '460.445.598-82' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'SABRINA FERREIRA DA SILVA', '464.439.238-39' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'ANA CLAUDIA CICERO DE FREITAS SALES', '098.327.804-03' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'LUCAS BENIGNO DE SOUSA', '436.532.018-10' FROM public.companies WHERE cnpj = '52.191.264/0001-73';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'SAMIRA VIEIRA LIMA DA SILVA', '244.819.098-46' FROM public.companies WHERE cnpj = '52.191.264/0001-73';

-- Insert employees for Q4
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'MATHEUS MATOS ALVES TAKAHASHI', '431.401.518-70' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'SILVANA ELIZABETH COSTA DE OLIVEIRA', '357.400.748-51' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'SANDRA GODOY DE SOUZA', '253.751.628-14' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'MATEUS MAGALHAES DOS SANTOS', '464.135.008-67' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'PIETRO AUGUSTO TONELLI', '432.869.088-43' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'SARA PACCANARO DE LIMA', '441.424.328-93' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'DAYLA APARECIDA BUENO', '510.512.768-45' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'GILMAR ALVES DE JESUS', '136.715.478-20' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'JESSICA DURAES DE OLIVEIRA', '420.346.148-01' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'VICTORIA DE PAULA SOLINA', '571.395.258-46' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'WEDER ALEXANDRE DIAS XAVIER', '350.240.298-10' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'JOSE EVERALDO DA SILVA', '365.074.378-75' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'FERNANDO CESAR DA SILVA LIMA', '076.134.785-21' FROM public.companies WHERE cnpj = '54.803.962/0001-08';
INSERT INTO public.employees (company_id, name, cpf) SELECT id, 'GABRIEL RODRIGUES SILVA LECI DOS SANTOS', '510.185.348-81' FROM public.companies WHERE cnpj = '54.803.962/0001-08';

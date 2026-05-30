/*
  # Adicionar Módulos Complementares do Sistema

  ## Mudanças Principais
  
  1. **Novas Tabelas**
     - fleet: Gestão de frota (veículos)
     - subjects: Assuntos para produtividade
     - production: Registro de produtividade
     - suggestions: Caixa de sugestões/ouvidoria
     - notices: Quadro de avisos
     - calendar: Agenda/agendamentos
     - document_types: Tipos de documentos
     - documents: Documentos dos funcionários
  
  2. **Segurança (RLS)**
     - Todas as tabelas com RLS habilitado
     - Políticas restritivas baseadas em autenticação
  
  3. **Relacionamentos**
     - Vinculação com funcionários
     - Controle de status em todas as tabelas
*/

-- Tabela de frota (veículos)
CREATE TABLE IF NOT EXISTS fleet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  vehicle_description text NOT NULL,
  plate text NOT NULL,
  renavam text,
  registration_date date DEFAULT CURRENT_DATE,
  fine_amount numeric(10,2) DEFAULT 0,
  kilometers_driven integer DEFAULT 0,
  stopped_time integer DEFAULT 0,
  speed_alert integer DEFAULT 0,
  driving_score integer DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de assuntos (para produtividade)
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  description text NOT NULL,
  abbreviation text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de produtividade
CREATE TABLE IF NOT EXISTS production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  production_type integer DEFAULT 0,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  production_date date NOT NULL,
  quantity numeric(10,2) DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de sugestões/ouvidoria
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  is_anonymous boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de quadro de avisos
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL,
  is_for_all boolean DEFAULT false,
  department_id uuid REFERENCES data_types(id) ON DELETE SET NULL,
  role_id uuid REFERENCES data_types(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de agenda
CREATE TABLE IF NOT EXISTS calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  scheduled_datetime timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de tipos de documentos
CREATE TABLE IF NOT EXISTS document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  description text NOT NULL,
  abbreviation text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type_id uuid REFERENCES document_types(id) ON DELETE SET NULL,
  document_number text,
  issue_date date,
  expiry_date date,
  issuing_agency text,
  file_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE production ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Políticas para fleet
CREATE POLICY "Authenticated users can view fleet"
  ON fleet FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fleet"
  ON fleet FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update fleet"
  ON fleet FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fleet"
  ON fleet FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para subjects
CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para production
CREATE POLICY "Authenticated users can view production"
  ON production FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert production"
  ON production FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update production"
  ON production FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete production"
  ON production FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para suggestions
CREATE POLICY "Authenticated users can view suggestions"
  ON suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert suggestions"
  ON suggestions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suggestions"
  ON suggestions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete suggestions"
  ON suggestions FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para notices
CREATE POLICY "Authenticated users can view notices"
  ON notices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notices"
  ON notices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notices"
  ON notices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notices"
  ON notices FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para calendar
CREATE POLICY "Authenticated users can view calendar"
  ON calendar FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert calendar"
  ON calendar FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update calendar"
  ON calendar FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete calendar"
  ON calendar FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para document_types
CREATE POLICY "Authenticated users can view document types"
  ON document_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert document types"
  ON document_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update document types"
  ON document_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete document types"
  ON document_types FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para documents
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (true);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_fleet_employee ON fleet(employee_id);
CREATE INDEX IF NOT EXISTS idx_fleet_plate ON fleet(plate);
CREATE INDEX IF NOT EXISTS idx_production_employee ON production(employee_id);
CREATE INDEX IF NOT EXISTS idx_production_date ON production(production_date);
CREATE INDEX IF NOT EXISTS idx_production_subject ON production(subject_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_employee ON suggestions(employee_id);
CREATE INDEX IF NOT EXISTS idx_notices_department ON notices(department_id);
CREATE INDEX IF NOT EXISTS idx_notices_role ON notices(role_id);
CREATE INDEX IF NOT EXISTS idx_notices_employee ON notices(employee_id);
CREATE INDEX IF NOT EXISTS idx_calendar_employee ON calendar(employee_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type_id);

/*
  # Sistema de Holerites e Espelhos de Ponto

  1. Novas Tabelas
    - `payroll_documents`
      - `id` (uuid, primary key)
      - `document_type` (text) - 'payslip' (holerite) ou 'timesheet' (espelho de ponto)
      - `reference_month` (date) - Mês de referência (YYYY-MM-01)
      - `title` (text) - Título do documento
      - `description` (text, nullable) - Descrição opcional
      - `file_url` (text) - URL do arquivo no storage
      - `created_by` (uuid, foreign key) - Admin que criou
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payroll_document_assignments`
      - `id` (uuid, primary key)
      - `document_id` (uuid, foreign key) - Referência ao documento
      - `employee_id` (uuid, foreign key) - Colaborador designado
      - `viewed_at` (timestamptz, nullable) - Quando visualizou
      - `signed_at` (timestamptz, nullable) - Quando assinou
      - `signature_data` (text, nullable) - Dados da assinatura digital (base64)
      - `created_at` (timestamptz)

  2. Storage
    - Bucket 'payroll-documents' para armazenar os arquivos

  3. Security
    - RLS habilitado em todas as tabelas
    - Admins (user_type_id 1 ou 2) podem gerenciar todos os documentos
    - Colaboradores só podem ver e assinar seus próprios documentos
*/

-- Criar tabela de documentos de folha de pagamento
CREATE TABLE IF NOT EXISTS payroll_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('payslip', 'timesheet')),
  reference_month date NOT NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  created_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de atribuições de documentos
CREATE TABLE IF NOT EXISTS payroll_document_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES payroll_documents(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz,
  signed_at timestamptz,
  signature_data text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, employee_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payroll_documents_reference_month ON payroll_documents(reference_month DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_type ON payroll_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_payroll_document_assignments_employee ON payroll_document_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_document_assignments_document ON payroll_document_assignments(document_id);
CREATE INDEX IF NOT EXISTS idx_payroll_document_assignments_signed ON payroll_document_assignments(signed_at);

-- Habilitar RLS
ALTER TABLE payroll_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_document_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas para payroll_documents
CREATE POLICY "Admins podem visualizar todos os documentos"
  ON payroll_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins podem inserir documentos"
  ON payroll_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins podem atualizar documentos"
  ON payroll_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins podem deletar documentos"
  ON payroll_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

-- Políticas para payroll_document_assignments
CREATE POLICY "Admins podem visualizar todas as atribuições"
  ON payroll_document_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Colaboradores podem visualizar suas próprias atribuições"
  ON payroll_document_assignments FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem inserir atribuições"
  ON payroll_document_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins podem atualizar atribuições"
  ON payroll_document_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Colaboradores podem atualizar suas próprias atribuições"
  ON payroll_document_assignments FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem deletar atribuições"
  ON payroll_document_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

-- Criar bucket de storage para documentos de folha de pagamento
INSERT INTO storage.buckets (id, name, public)
VALUES ('payroll-documents', 'payroll-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para payroll-documents
CREATE POLICY "Admins podem fazer upload de documentos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payroll-documents' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins podem atualizar documentos storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'payroll-documents' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins podem deletar documentos storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payroll-documents' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Usuarios autenticados podem visualizar documentos storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payroll-documents');

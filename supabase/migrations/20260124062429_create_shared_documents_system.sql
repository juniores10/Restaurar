/*
  # Sistema de Documentos Compartilhados

  1. Novas Tabelas
    - `shared_documents`
      - `id` (uuid, chave primária)
      - `title` (text) - Título do documento
      - `description` (text) - Descrição do documento
      - `file_url` (text) - URL do arquivo no Supabase Storage
      - `file_name` (text) - Nome original do arquivo
      - `file_size` (bigint) - Tamanho do arquivo em bytes
      - `file_type` (text) - Tipo MIME do arquivo
      - `status` (integer) - Status do documento (0=ativo, 1=arquivado)
      - `created_by` (uuid) - Usuário que criou
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `document_recipients`
      - `id` (uuid, chave primária)
      - `document_id` (uuid) - Referência ao documento
      - `employee_id` (uuid) - Referência ao funcionário
      - `created_at` (timestamptz)
    
    - `document_reads`
      - `id` (uuid, chave primária)
      - `document_id` (uuid) - Referência ao documento
      - `employee_id` (uuid) - Referência ao funcionário
      - `read_at` (timestamptz) - Quando foi lido
  
  2. Segurança
    - Habilita RLS em todas as tabelas
    - Políticas para administradores criarem e gerenciarem documentos
    - Políticas para funcionários visualizarem apenas seus documentos
    - Políticas para rastrear leituras
*/

-- Criar tabela de documentos compartilhados
CREATE TABLE IF NOT EXISTS shared_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint DEFAULT 0,
  file_type text,
  status integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de destinatários de documentos
CREATE TABLE IF NOT EXISTS document_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES shared_documents(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, employee_id)
);

-- Criar tabela de rastreamento de leituras
CREATE TABLE IF NOT EXISTS document_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES shared_documents(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(document_id, employee_id)
);

-- Habilitar RLS
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reads ENABLE ROW LEVEL SECURITY;

-- Políticas para shared_documents
CREATE POLICY "Admins can view all documents"
  ON shared_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can create documents"
  ON shared_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can update documents"
  ON shared_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can delete documents"
  ON shared_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can view their documents"
  ON shared_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_recipients dr
      JOIN employees e ON e.id = dr.employee_id
      WHERE dr.document_id = shared_documents.id
      AND e.auth_user_id = auth.uid()
    )
  );

-- Políticas para document_recipients
CREATE POLICY "Admins can manage recipients"
  ON document_recipients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can view their assignments"
  ON document_recipients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = document_recipients.employee_id
      AND employees.auth_user_id = auth.uid()
    )
  );

-- Políticas para document_reads
CREATE POLICY "Admins can view all reads"
  ON document_reads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can mark as read"
  ON document_reads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = document_reads.employee_id
      AND employees.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can view their reads"
  ON document_reads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = document_reads.employee_id
      AND employees.auth_user_id = auth.uid()
    )
  );

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_document_recipients_document_id ON document_recipients(document_id);
CREATE INDEX IF NOT EXISTS idx_document_recipients_employee_id ON document_recipients(employee_id);
CREATE INDEX IF NOT EXISTS idx_document_reads_document_id ON document_reads(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reads_employee_id ON document_reads(employee_id);
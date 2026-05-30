/*
  # Sistema de Histórico de Conciliações

  1. Novas Tabelas
    - `reconciliations`
      - `id` (uuid, primary key)
      - `name` (text) - Nome da conciliação
      - `description` (text) - Descrição opcional
      - `file1_name` (text) - Nome do primeiro arquivo
      - `file2_name` (text) - Nome do segundo arquivo
      - `total_records` (integer) - Total de registros unificados
      - `created_by` (uuid) - Referência ao usuário que criou
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `reconciliation_records`
      - `id` (uuid, primary key)
      - `reconciliation_id` (uuid) - Referência à conciliação
      - `nome` (text) - Nome do cliente
      - `cpf_cnpj` (text) - CPF ou CNPJ
      - `linha_telefonica` (text) - Número da linha
      - `plano` (text) - Tipo de plano
      - `status` (text) - Status da linha

  2. Segurança
    - RLS habilitado em ambas as tabelas
    - Políticas para admins e usuários autenticados
*/

-- Tabela principal de conciliações
CREATE TABLE IF NOT EXISTS reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  file1_name text DEFAULT '',
  file2_name text DEFAULT '',
  total_records integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de registros da conciliação
CREATE TABLE IF NOT EXISTS reconciliation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id uuid NOT NULL REFERENCES reconciliations(id) ON DELETE CASCADE,
  nome text DEFAULT '',
  cpf_cnpj text DEFAULT '',
  linha_telefonica text DEFAULT '',
  plano text DEFAULT '',
  status text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_reconciliation_id 
  ON reconciliation_records(reconciliation_id);

CREATE INDEX IF NOT EXISTS idx_reconciliations_created_by 
  ON reconciliations(created_by);

CREATE INDEX IF NOT EXISTS idx_reconciliations_created_at 
  ON reconciliations(created_at DESC);

-- Habilitar RLS
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_records ENABLE ROW LEVEL SECURITY;

-- Políticas para reconciliations
CREATE POLICY "Admins can view all reconciliations"
  ON reconciliations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

CREATE POLICY "Admins can insert reconciliations"
  ON reconciliations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

CREATE POLICY "Admins can update reconciliations"
  ON reconciliations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

CREATE POLICY "Admins can delete reconciliations"
  ON reconciliations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

-- Políticas para reconciliation_records
CREATE POLICY "Admins can view all reconciliation records"
  ON reconciliation_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

CREATE POLICY "Admins can insert reconciliation records"
  ON reconciliation_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

CREATE POLICY "Admins can update reconciliation records"
  ON reconciliation_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

CREATE POLICY "Admins can delete reconciliation records"
  ON reconciliation_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_reconciliation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reconciliation_updated_at ON reconciliations;
CREATE TRIGGER trigger_reconciliation_updated_at
  BEFORE UPDATE ON reconciliations
  FOR EACH ROW
  EXECUTE FUNCTION update_reconciliation_updated_at();

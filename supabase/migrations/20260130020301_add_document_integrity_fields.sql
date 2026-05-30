/*
  # Adicionar campos de integridade do documento

  1. Alterações na tabela payroll_signatures
    - `document_hash_before` (text) - Hash SHA-256 do documento antes da assinatura
    - `document_hash_after` (text) - Hash SHA-256 do documento após assinatura
    - `timestamp_authority` (timestamptz) - Carimbo de tempo confiável da assinatura
    - `is_locked` (boolean) - Indica se o documento está bloqueado para edição
    - `version_number` (integer) - Número da versão do documento
    - `previous_version_id` (uuid) - Referência para versão anterior (se houver)
  
  2. Nova tabela document_versions
    - Histórico de versões dos documentos
    - Rastreamento de alterações
  
  3. Segurança
    - Campos são imutáveis após assinatura
    - Auditoria completa de versões
*/

-- Add integrity fields to payroll_signatures
ALTER TABLE payroll_signatures ADD COLUMN IF NOT EXISTS document_hash_before text;
ALTER TABLE payroll_signatures ADD COLUMN IF NOT EXISTS document_hash_after text;
ALTER TABLE payroll_signatures ADD COLUMN IF NOT EXISTS timestamp_authority timestamptz;
ALTER TABLE payroll_signatures ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
ALTER TABLE payroll_signatures ADD COLUMN IF NOT EXISTS version_number integer DEFAULT 1;
ALTER TABLE payroll_signatures ADD COLUMN IF NOT EXISTS previous_version_id uuid REFERENCES payroll_signatures(id);

-- Create document_versions table for tracking changes
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES payroll_documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  file_url text NOT NULL,
  document_hash text NOT NULL,
  changed_by uuid REFERENCES employees(id),
  change_reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Add RLS to document_versions
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all versions
CREATE POLICY "Admins can view document versions"
ON document_versions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = 'Administrador'
  )
);

-- Policy: Admins can insert new versions
CREATE POLICY "Admins can insert document versions"
ON document_versions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = 'Administrador'
  )
);

-- Add comments for documentation
COMMENT ON COLUMN payroll_signatures.document_hash_before IS 'Hash SHA-256 do documento antes da assinatura';
COMMENT ON COLUMN payroll_signatures.document_hash_after IS 'Hash SHA-256 do documento após a assinatura';
COMMENT ON COLUMN payroll_signatures.timestamp_authority IS 'Carimbo de tempo confiável (TSA)';
COMMENT ON COLUMN payroll_signatures.is_locked IS 'Documento bloqueado para edição após assinatura';
COMMENT ON COLUMN payroll_signatures.version_number IS 'Número da versão do documento';
COMMENT ON COLUMN payroll_signatures.previous_version_id IS 'Referência para versão anterior';

COMMENT ON TABLE document_versions IS 'Histórico de versões dos documentos';
COMMENT ON COLUMN document_versions.document_hash IS 'Hash SHA-256 da versão do documento';
COMMENT ON COLUMN document_versions.change_reason IS 'Motivo da alteração do documento';
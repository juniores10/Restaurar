/*
  # Adicionar suporte a anexos nos avisos

  1. Alterações na tabela notices
    - Adiciona campo `file_url` para armazenar o URL do anexo
    - Adiciona campo `file_name` para o nome original do arquivo
    - Adiciona campo `file_type` para o tipo MIME do arquivo
    
  2. Storage
    - Cria bucket `notice-attachments` para armazenar anexos
    - Configura políticas de acesso ao bucket
*/

-- Adicionar campos para anexos na tabela notices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE notices ADD COLUMN file_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE notices ADD COLUMN file_name text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE notices ADD COLUMN file_type text;
  END IF;
END $$;

-- Criar bucket para anexos de avisos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('notice-attachments', 'notice-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket notice-attachments

-- Permitir que admins e gerentes façam upload
DROP POLICY IF EXISTS "Admins and managers can upload notice attachments" ON storage.objects;
CREATE POLICY "Admins and managers can upload notice attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notice-attachments' AND
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.auth_user_id = auth.uid()
    AND employees.user_type_id IN (1, 2)
  )
);

-- Permitir que admins e gerentes deletem arquivos
DROP POLICY IF EXISTS "Admins and managers can delete notice attachments" ON storage.objects;
CREATE POLICY "Admins and managers can delete notice attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'notice-attachments' AND
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.auth_user_id = auth.uid()
    AND employees.user_type_id IN (1, 2)
  )
);

-- Permitir que todos os funcionários autenticados visualizem os anexos
DROP POLICY IF EXISTS "Authenticated employees can view notice attachments" ON storage.objects;
CREATE POLICY "Authenticated employees can view notice attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'notice-attachments'
);
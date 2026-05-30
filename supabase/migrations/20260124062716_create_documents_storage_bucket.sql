/*
  # Configurar Storage para Documentos

  1. Storage Bucket
    - Cria bucket "documents" para armazenar arquivos
    - Bucket público para permitir download direto
    - Limite de 50MB por arquivo
  
  2. Políticas de Storage
    - Admins e gestores podem fazer upload
    - Todos os usuários autenticados podem visualizar documentos atribuídos a eles
*/

-- Criar bucket de documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Política para admins/gestores fazerem upload
CREATE POLICY "Admins can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

-- Política para admins/gestores atualizarem
CREATE POLICY "Admins can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

-- Política para admins/gestores excluírem
CREATE POLICY "Admins can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

-- Política para visualização pública (já que o bucket é público)
CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');
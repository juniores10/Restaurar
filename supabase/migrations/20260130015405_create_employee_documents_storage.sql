/*
  # Criar bucket de storage para documentos de identificação

  1. Novo Bucket
    - `employee-documents` - Para armazenar RG, CPF e outros documentos de identificação
  
  2. Segurança
    - Apenas administradores podem fazer upload
    - Apenas administradores podem visualizar documentos
    - Arquivos são privados por padrão
*/

-- Create storage bucket for employee documents (RG/CPF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for employee documents

-- Allow admins to upload employee documents
CREATE POLICY "Admins can upload employee documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  EXISTS (
    SELECT 1 FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = 'Administrador'
  )
);

-- Allow admins to view employee documents
CREATE POLICY "Admins can view employee documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  EXISTS (
    SELECT 1 FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = 'Administrador'
  )
);

-- Allow admins to update employee documents
CREATE POLICY "Admins can update employee documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  EXISTS (
    SELECT 1 FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = 'Administrador'
  )
)
WITH CHECK (
  bucket_id = 'employee-documents' AND
  EXISTS (
    SELECT 1 FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = 'Administrador'
  )
);

-- Allow admins to delete employee documents
CREATE POLICY "Admins can delete employee documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  EXISTS (
    SELECT 1 FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = 'Administrador'
  )
);
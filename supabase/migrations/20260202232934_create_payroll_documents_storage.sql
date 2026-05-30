/*
  # Create Storage Bucket for Payroll Documents

  1. Changes
    - Create payroll-documents storage bucket
    - Set up RLS policies for file access

  2. Security
    - Admins can upload and manage all files
    - Employees can view their own assigned document files
*/

-- Create the storage bucket for payroll documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('payroll-documents', 'payroll-documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Policy for admins to manage all files
CREATE POLICY "Admins can manage payroll document files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'payroll-documents'
  AND EXISTS (
    SELECT 1 FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = 'Administrador'
  )
)
WITH CHECK (
  bucket_id = 'payroll-documents'
  AND EXISTS (
    SELECT 1 FROM employees e
    JOIN user_types ut ON e.user_type_id = ut.id
    WHERE e.auth_user_id = auth.uid()
    AND ut.name = 'Administrador'
  )
);

-- Policy for employees to download their own documents
CREATE POLICY "Employees can view own payroll document files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payroll-documents'
  AND (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
    OR
    EXISTS (
      SELECT 1 FROM payroll_document_assignments pda
      JOIN employees e ON e.id = pda.employee_id
      WHERE e.auth_user_id = auth.uid()
      AND (pda.file_url LIKE '%' || name || '%' OR name LIKE '%' || e.id::text || '%')
    )
  )
);

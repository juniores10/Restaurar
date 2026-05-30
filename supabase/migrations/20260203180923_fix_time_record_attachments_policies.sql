/*
  # Fix time record attachments storage policies

  1. Changes
    - Drop existing restrictive policies
    - Create simpler policies that allow authenticated users to upload, view and delete their attachments
    - Fix JWT issues by using simpler policy checks

  2. Security
    - Any authenticated user can upload attachments
    - Users can view and delete their own uploads based on folder structure
    - Admins and Managers can view and delete all attachments
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins and Managers can upload time record attachments" ON storage.objects;
DROP POLICY IF EXISTS "Employees can upload attachments for their own time records" ON storage.objects;
DROP POLICY IF EXISTS "Admins and Managers can view all time record attachments" ON storage.objects;
DROP POLICY IF EXISTS "Employees can view attachments of their own time records" ON storage.objects;
DROP POLICY IF EXISTS "Admins and Managers can delete time record attachments" ON storage.objects;
DROP POLICY IF EXISTS "Employees can delete attachments of their own time records" ON storage.objects;

-- Create new simplified policies

-- Upload: Any authenticated user can upload
CREATE POLICY "Authenticated users can upload time record attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'time-record-attachments');

-- Select: Admins and Managers can view all, employees can view their own
CREATE POLICY "Admins and Managers view all time record attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'time-record-attachments'
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gerente')
      )
    )
  );

CREATE POLICY "Users view their own time record attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'time-record-attachments'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Delete: Admins and Managers can delete all, users can delete their own
CREATE POLICY "Admins and Managers delete all time record attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'time-record-attachments'
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gerente')
      )
    )
  );

CREATE POLICY "Users delete their own time record attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'time-record-attachments'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );
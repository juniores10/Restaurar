/*
  # Create storage bucket for time record attachments

  1. Storage
    - Create time-record-attachments bucket for PDF files
    - Set up RLS policies for secure access

  2. Security
    - Admins and Managers can upload files
    - Employees can upload files for their own time records
    - Admins and Managers can view all files
    - Employees can view files of their own time records
    - Admins and Managers can delete files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('time-record-attachments', 'time-record-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins and Managers can upload time record attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'time-record-attachments'
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can upload attachments for their own time records"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'time-record-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM employees e
      WHERE e.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and Managers can view all time record attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'time-record-attachments'
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can view attachments of their own time records"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'time-record-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM employees e
      WHERE e.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and Managers can delete time record attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'time-record-attachments'
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can delete attachments of their own time records"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'time-record-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM employees e
      WHERE e.auth_user_id = auth.uid()
    )
  );
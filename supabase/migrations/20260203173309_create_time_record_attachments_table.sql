/*
  # Create time record attachments system

  1. New Tables
    - time_record_attachments
      - id (uuid, primary key)
      - time_record_id (uuid, foreign key to time_records)
      - file_name (text) - Original filename
      - file_path (text) - Path in storage
      - file_size (bigint) - Size in bytes
      - uploaded_by (uuid, foreign key to employees)
      - uploaded_at (timestamp)
      - description (text, optional) - Description of the attachment
      - created_at (timestamp)

  2. Security
    - Enable RLS on time_record_attachments table
    - Admins and Managers can view all attachments
    - Employees can view attachments of their own time records
    - Admins and Managers can upload attachments
    - Employees can upload attachments to their own time records
*/

CREATE TABLE IF NOT EXISTS time_record_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_record_id uuid NOT NULL REFERENCES time_records(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now(),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE time_record_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Managers can view all time record attachments"
  ON time_record_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can view attachments of their own time records"
  ON time_record_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM time_records tr
      JOIN employees e ON tr.employee_id = e.id
      WHERE tr.id = time_record_attachments.time_record_id
      AND e.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and Managers can upload time record attachments"
  ON time_record_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can upload attachments to their own time records"
  ON time_record_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM time_records tr
      JOIN employees e ON tr.employee_id = e.id
      WHERE tr.id = time_record_attachments.time_record_id
      AND e.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and Managers can delete time record attachments"
  ON time_record_attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can delete attachments of their own time records"
  ON time_record_attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM time_records tr
      JOIN employees e ON tr.employee_id = e.id
      WHERE tr.id = time_record_attachments.time_record_id
      AND e.auth_user_id = auth.uid()
    )
  );
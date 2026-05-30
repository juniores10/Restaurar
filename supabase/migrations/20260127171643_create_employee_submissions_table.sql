/*
  # Create employee submissions table

  1. New Tables
    - `employee_submissions`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `title` (text, submission title)
      - `description` (text, submission description/message)
      - `file_url` (text, optional file URL)
      - `file_name` (text, optional file name)
      - `file_type` (text, optional file MIME type)
      - `status` (integer, 0=pending, 1=reviewed)
      - `reviewed_by` (uuid, optional, admin who reviewed)
      - `reviewed_at` (timestamp, when it was reviewed)
      - `admin_notes` (text, optional notes from admin)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `employee_submissions` table
    - Employees can insert their own submissions
    - Employees can view their own submissions
    - Admins can view and update all submissions

  3. Notes
    - This table stores documents and messages sent by employees to administrators
*/

CREATE TABLE IF NOT EXISTS employee_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  file_name text,
  file_type text,
  status integer DEFAULT 0,
  reviewed_by uuid REFERENCES employees(id),
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can insert their own submissions"
  ON employee_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can view their own submissions"
  ON employee_submissions
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all submissions"
  ON employee_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = 1
    )
  );

CREATE POLICY "Admins can update all submissions"
  ON employee_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = 1
    )
  );

CREATE INDEX IF NOT EXISTS idx_employee_submissions_employee_id ON employee_submissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_submissions_status ON employee_submissions(status);
CREATE INDEX IF NOT EXISTS idx_employee_submissions_created_at ON employee_submissions(created_at DESC);
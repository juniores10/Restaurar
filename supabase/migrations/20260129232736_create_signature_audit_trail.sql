/*
  # Create Signature Audit Trail System

  1. New Tables
    - `payroll_signatures`
      - `id` (uuid, primary key)
      - `payroll_assignment_id` (uuid, foreign key to payroll_document_assignments)
      - `employee_id` (uuid, foreign key to employees)
      - `selfie_url` (text) - URL to the selfie photo in storage
      - `latitude` (numeric) - GPS latitude
      - `longitude` (numeric) - GPS longitude
      - `ip_address` (text) - IP address of the device
      - `user_agent` (text) - Browser user agent
      - `signed_at` (timestamptz) - Timestamp of signature
      - `created_at` (timestamptz)

  2. Storage
    - Create bucket for signature selfies

  3. Security
    - Enable RLS on `payroll_signatures` table
    - Employees can insert their own signatures
    - Employees can view their own signatures
    - Admins can view all signatures
*/

-- Create payroll_signatures table
CREATE TABLE IF NOT EXISTS payroll_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_assignment_id uuid NOT NULL REFERENCES payroll_document_assignments(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  selfie_url text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  ip_address text,
  user_agent text,
  signed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payroll_signatures ENABLE ROW LEVEL SECURITY;

-- Employees can insert their own signatures
CREATE POLICY "Employees can insert own signatures"
  ON payroll_signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Employees can view their own signatures
CREATE POLICY "Employees can view own signatures"
  ON payroll_signatures
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all signatures
CREATE POLICY "Admins can view all signatures"
  ON payroll_signatures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.description = 'Administrador'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payroll_signatures_assignment
  ON payroll_signatures(payroll_assignment_id);

CREATE INDEX IF NOT EXISTS idx_payroll_signatures_employee
  ON payroll_signatures(employee_id);

-- Insert storage bucket for signature selfies
INSERT INTO storage.buckets (id, name, public)
VALUES ('signature-selfies', 'signature-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for signature selfies
CREATE POLICY "Employees can upload own signature selfies"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'signature-selfies' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can view own signature selfies"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'signature-selfies' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all signature selfies"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'signature-selfies' AND
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.description = 'Administrador'
    )
  );

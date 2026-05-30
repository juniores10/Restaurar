/*
  # Create Payroll Documents System

  1. New Tables
    - `payroll_documents`
      - Stores uploaded payroll/timesheet documents
      - Tracks document type, reference period, file info
    
    - `payroll_document_assignments`
      - Links documents to employees
      - Tracks signature status and viewing

  2. Security
    - Enable RLS on all tables
    - Admin users can manage all data
    - Employees can view their own assigned documents
*/

-- Table for payroll documents (holerites and pontos)
CREATE TABLE IF NOT EXISTS payroll_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('holerite', 'ponto')),
  reference_month text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  description text,
  status integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table for document assignments to employees
CREATE TABLE IF NOT EXISTS payroll_document_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES payroll_documents(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  file_url text,
  is_viewed boolean DEFAULT false,
  viewed_at timestamptz,
  is_signed boolean DEFAULT false,
  signed_at timestamptz,
  signature_url text,
  signature_ip text,
  signature_device text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, employee_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payroll_documents_type ON payroll_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_month ON payroll_documents(reference_month);
CREATE INDEX IF NOT EXISTS idx_payroll_assignments_document ON payroll_document_assignments(document_id);
CREATE INDEX IF NOT EXISTS idx_payroll_assignments_employee ON payroll_document_assignments(employee_id);

-- Enable RLS
ALTER TABLE payroll_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_document_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for payroll_documents
CREATE POLICY "Admins can manage payroll documents"
  ON payroll_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  );

CREATE POLICY "Employees can view payroll documents assigned to them"
  ON payroll_documents FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT pda.document_id 
      FROM payroll_document_assignments pda
      JOIN employees e ON e.id = pda.employee_id
      WHERE e.auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  );

-- Policies for payroll_document_assignments
CREATE POLICY "Admins can manage payroll document assignments"
  ON payroll_document_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  );

CREATE POLICY "Employees can view own payroll assignments"
  ON payroll_document_assignments FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  );

CREATE POLICY "Employees can update own payroll assignments for signature"
  ON payroll_document_assignments FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

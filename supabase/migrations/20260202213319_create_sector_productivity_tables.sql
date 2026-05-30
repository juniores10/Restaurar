/*
  # Create Sector Productivity Tables

  1. New Tables
    - `sector_productivity_uploads`
      - Stores metadata about uploaded sector productivity files
      - Links to sector and reference month
      - Tracks matched/unmatched records
    
    - `sector_productivity_records`
      - Individual daily productivity records for employees by sector
      - Supports both numeric points and text categories
  
  2. Security
    - Enable RLS on all tables
    - Admin users can manage all data
    - Employees can view their own productivity data
*/

-- Table for sector productivity uploads metadata
CREATE TABLE IF NOT EXISTS sector_productivity_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id uuid REFERENCES data_types(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  reference_month text NOT NULL,
  total_records integer DEFAULT 0,
  matched_records integer DEFAULT 0,
  unmatched_records integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  description text,
  upload_date timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Table for individual sector productivity records
CREATE TABLE IF NOT EXISTS sector_productivity_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES sector_productivity_uploads(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  employee_name_original text NOT NULL,
  work_date date NOT NULL,
  points numeric,
  category text,
  subject text,
  section_type text NOT NULL,
  sector_id uuid REFERENCES data_types(id),
  is_matched boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sector_prod_uploads_sector ON sector_productivity_uploads(sector_id);
CREATE INDEX IF NOT EXISTS idx_sector_prod_uploads_month ON sector_productivity_uploads(reference_month);
CREATE INDEX IF NOT EXISTS idx_sector_prod_records_upload ON sector_productivity_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_sector_prod_records_employee ON sector_productivity_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_sector_prod_records_date ON sector_productivity_records(work_date);
CREATE INDEX IF NOT EXISTS idx_sector_prod_records_section ON sector_productivity_records(section_type);

-- Enable RLS
ALTER TABLE sector_productivity_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_productivity_records ENABLE ROW LEVEL SECURITY;

-- Policies for sector_productivity_uploads
CREATE POLICY "Admins can manage sector productivity uploads"
  ON sector_productivity_uploads FOR ALL
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

CREATE POLICY "Employees can view sector productivity uploads"
  ON sector_productivity_uploads FOR SELECT
  TO authenticated
  USING (true);

-- Policies for sector_productivity_records
CREATE POLICY "Admins can manage sector productivity records"
  ON sector_productivity_records FOR ALL
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

CREATE POLICY "Employees can view own sector productivity records"
  ON sector_productivity_records FOR SELECT
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
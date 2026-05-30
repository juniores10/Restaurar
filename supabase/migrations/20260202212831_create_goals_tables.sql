/*
  # Create Goals (Metas) System Tables

  1. New Tables
    - `goals_productivity_uploads`
      - Stores metadata about uploaded goals files
      - Links to sector and reference month
      - Tracks matched/unmatched records
    
    - `goals_productivity_records`
      - Individual daily goal records for employees
      - Can include subjects for detailed tracking
      - Supports both numeric points and text categories
    
    - `productivity_sections`
      - Defines sections/tables within a goals upload
      - Configurable display options
  
  2. Security
    - Enable RLS on all tables
    - Admin users can manage all data
    - Employees can view their own goal data
*/

-- Table for goals uploads metadata
CREATE TABLE IF NOT EXISTS goals_productivity_uploads (
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

-- Table for individual goal records
CREATE TABLE IF NOT EXISTS goals_productivity_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES goals_productivity_uploads(id) ON DELETE CASCADE,
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

-- Table for productivity sections
CREATE TABLE IF NOT EXISTS productivity_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES goals_productivity_uploads(id) ON DELETE CASCADE,
  title text NOT NULL,
  section_key text NOT NULL,
  display_order integer DEFAULT 0,
  has_subject boolean DEFAULT false,
  show_employee_total boolean DEFAULT false,
  show_day_total boolean DEFAULT false,
  status integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_uploads_sector ON goals_productivity_uploads(sector_id);
CREATE INDEX IF NOT EXISTS idx_goals_uploads_month ON goals_productivity_uploads(reference_month);
CREATE INDEX IF NOT EXISTS idx_goals_records_upload ON goals_productivity_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_goals_records_employee ON goals_productivity_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_goals_records_date ON goals_productivity_records(work_date);
CREATE INDEX IF NOT EXISTS idx_goals_records_section ON goals_productivity_records(section_type);
CREATE INDEX IF NOT EXISTS idx_productivity_sections_upload ON productivity_sections(upload_id);

-- Enable RLS
ALTER TABLE goals_productivity_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_productivity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_sections ENABLE ROW LEVEL SECURITY;

-- Policies for goals_productivity_uploads
CREATE POLICY "Admins can manage goal uploads"
  ON goals_productivity_uploads FOR ALL
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

CREATE POLICY "Employees can view goal uploads"
  ON goals_productivity_uploads FOR SELECT
  TO authenticated
  USING (true);

-- Policies for goals_productivity_records
CREATE POLICY "Admins can manage goal records"
  ON goals_productivity_records FOR ALL
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

CREATE POLICY "Employees can view own goal records"
  ON goals_productivity_records FOR SELECT
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

-- Policies for productivity_sections
CREATE POLICY "Admins can manage productivity sections"
  ON productivity_sections FOR ALL
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

CREATE POLICY "Employees can view productivity sections"
  ON productivity_sections FOR SELECT
  TO authenticated
  USING (true);
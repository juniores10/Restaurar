/*
  # Create Goals System Tables
  
  1. New Tables
    - `goals_productivity_uploads` - stores goals upload metadata
      - `id` (uuid, primary key)
      - `sector_id` (uuid, foreign key to data_types)
      - `file_name` (text)
      - `reference_month` (date)
      - `total_records` (integer)
      - `matched_records` (integer)
      - `unmatched_records` (integer)
      - `upload_date` (timestamptz)
      - `error_log` (jsonb)
      - `description` (text)
      - `created_by` (uuid)
      - `status` (integer)
    
    - `goals_productivity_records` - stores individual goals records
      - `id` (uuid, primary key)
      - `upload_id` (uuid, foreign key)
      - `sector_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key, nullable)
      - `employee_name_original` (text)
      - `work_date` (date)
      - `points` (numeric)
      - `category` (text, nullable)
      - `subject` (text, nullable)
      - `is_matched` (boolean)
      - `section_type` (text, nullable)
      - `status` (integer)
      - `created_at` (timestamptz)
    
    - `goals_productivity_sections` - stores section metadata
      - `id` (uuid, primary key)
      - `upload_id` (uuid, foreign key)
      - `title` (text)
      - `section_key` (text)
      - `display_order` (integer)
      - `has_subject` (boolean)
      - `show_employee_total` (boolean)
      - `show_day_total` (boolean)
      - `status` (integer)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users (admins: user_type_id 1 or 2)
*/

-- Create goals_productivity_uploads table
CREATE TABLE IF NOT EXISTS goals_productivity_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id uuid REFERENCES data_types(id),
  file_name text NOT NULL,
  reference_month date NOT NULL,
  total_records integer DEFAULT 0,
  matched_records integer DEFAULT 0,
  unmatched_records integer DEFAULT 0,
  upload_date timestamptz DEFAULT now(),
  error_log jsonb DEFAULT '[]'::jsonb,
  description text,
  created_by uuid REFERENCES auth.users(id),
  status integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create goals_productivity_records table
CREATE TABLE IF NOT EXISTS goals_productivity_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES goals_productivity_uploads(id) ON DELETE CASCADE,
  sector_id uuid REFERENCES data_types(id),
  employee_id uuid REFERENCES employees(id),
  employee_name_original text NOT NULL,
  work_date date NOT NULL,
  points numeric DEFAULT 0,
  category text,
  subject text,
  is_matched boolean DEFAULT false,
  section_type text,
  status integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create goals_productivity_sections table
CREATE TABLE IF NOT EXISTS goals_productivity_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES goals_productivity_uploads(id) ON DELETE CASCADE,
  title text NOT NULL,
  section_key text NOT NULL,
  display_order integer DEFAULT 0,
  has_subject boolean DEFAULT false,
  show_employee_total boolean DEFAULT true,
  show_day_total boolean DEFAULT true,
  status integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE goals_productivity_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_productivity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_productivity_sections ENABLE ROW LEVEL SECURITY;

-- Policies for goals_productivity_uploads
CREATE POLICY "Admins can manage goals uploads"
  ON goals_productivity_uploads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = ANY (ARRAY[1, 2])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = ANY (ARRAY[1, 2])
    )
  );

CREATE POLICY "Employees can view own goals uploads"
  ON goals_productivity_uploads
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT upload_id FROM goals_productivity_records
      WHERE employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Policies for goals_productivity_records
CREATE POLICY "Admins can manage goals records"
  ON goals_productivity_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = ANY (ARRAY[1, 2])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = ANY (ARRAY[1, 2])
    )
  );

CREATE POLICY "Employees can view own goals records"
  ON goals_productivity_records
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Policies for goals_productivity_sections
CREATE POLICY "Admins can manage goals sections"
  ON goals_productivity_sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = ANY (ARRAY[1, 2])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = ANY (ARRAY[1, 2])
    )
  );

CREATE POLICY "Employees can view goals sections"
  ON goals_productivity_sections
  FOR SELECT
  TO authenticated
  USING (
    upload_id IN (
      SELECT DISTINCT upload_id FROM goals_productivity_records
      WHERE employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_productivity_uploads_sector ON goals_productivity_uploads(sector_id);
CREATE INDEX IF NOT EXISTS idx_goals_productivity_uploads_month ON goals_productivity_uploads(reference_month);
CREATE INDEX IF NOT EXISTS idx_goals_productivity_records_upload ON goals_productivity_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_goals_productivity_records_employee ON goals_productivity_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_goals_productivity_records_date ON goals_productivity_records(work_date);
CREATE INDEX IF NOT EXISTS idx_goals_productivity_sections_upload ON goals_productivity_sections(upload_id);

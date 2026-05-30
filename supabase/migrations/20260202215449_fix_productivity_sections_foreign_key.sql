/*
  # Fix Productivity Sections Foreign Key

  1. Changes
    - Drop existing productivity_sections table
    - Create new productivity_sections table with correct foreign key to sector_productivity_uploads
    - Recreate indexes and RLS policies
  
  2. Security
    - Maintain existing RLS policies for admin and employee access
*/

-- Drop the existing table (it references the wrong parent table)
DROP TABLE IF EXISTS productivity_sections CASCADE;

-- Create productivity_sections with correct foreign key
CREATE TABLE productivity_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES sector_productivity_uploads(id) ON DELETE CASCADE,
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

-- Create index
CREATE INDEX idx_productivity_sections_upload ON productivity_sections(upload_id);

-- Enable RLS
ALTER TABLE productivity_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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
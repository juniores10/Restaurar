/*
  # Create productivity sections table for dynamic table management
  
  1. New Tables
    - `productivity_sections`
      - `id` (uuid, primary key)
      - `upload_id` (uuid, foreign key to sector_productivity_uploads)
      - `title` (text) - Nome/título da tabela
      - `section_key` (text) - Chave única para identificar a seção
      - `display_order` (integer) - Ordem de exibição
      - `has_subject` (boolean) - Se a seção tem campo de assunto
      - `status` (integer) - Status da seção (0=ativo, 1=inativo)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Changes
    - Add index for faster queries on upload_id and section_key
  
  3. Security
    - Enable RLS on productivity_sections table
    - Add policies for authenticated users with system management permissions
  
  4. Notes
    - This allows admins to create custom productivity tables/sections
    - Each section can have its own title and configuration
    - Sections are scoped to a specific upload/period
*/

-- Create productivity sections table
CREATE TABLE IF NOT EXISTS productivity_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES sector_productivity_uploads(id) ON DELETE CASCADE,
  title text NOT NULL,
  section_key text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  has_subject boolean DEFAULT false,
  status integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to prevent duplicate section_keys per upload
ALTER TABLE productivity_sections 
ADD CONSTRAINT productivity_sections_upload_section_key UNIQUE (upload_id, section_key);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_productivity_sections_upload_id 
ON productivity_sections(upload_id);

CREATE INDEX IF NOT EXISTS idx_productivity_sections_section_key 
ON productivity_sections(upload_id, section_key);

-- Enable RLS
ALTER TABLE productivity_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated admin users
CREATE POLICY "Admins can view all productivity sections"
  ON productivity_sections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can insert productivity sections"
  ON productivity_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can update productivity sections"
  ON productivity_sections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can delete productivity sections"
  ON productivity_sections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

-- Insert default sections for existing uploads
INSERT INTO productivity_sections (upload_id, title, section_key, display_order, has_subject, status)
SELECT 
  id,
  'ATENDIMENTOS OPA',
  'ATENDIMENTOS_OPA',
  1,
  false,
  0
FROM sector_productivity_uploads
WHERE NOT EXISTS (
  SELECT 1 FROM productivity_sections 
  WHERE productivity_sections.upload_id = sector_productivity_uploads.id 
  AND productivity_sections.section_key = 'ATENDIMENTOS_OPA'
);

INSERT INTO productivity_sections (upload_id, title, section_key, display_order, has_subject, status)
SELECT 
  id,
  'IXC',
  'IXC',
  2,
  true,
  0
FROM sector_productivity_uploads
WHERE NOT EXISTS (
  SELECT 1 FROM productivity_sections 
  WHERE productivity_sections.upload_id = sector_productivity_uploads.id 
  AND productivity_sections.section_key = 'IXC'
);
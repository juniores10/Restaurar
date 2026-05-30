/*
  # Create Productivity Categories Table

  1. New Tables
    - `productivity_categories`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Category code (e.g., FO, FE, AT)
      - `name` (text) - Category full name
      - `description` (text, optional) - Category description
      - `color` (text, optional) - Color for UI display
      - `is_active` (boolean) - Whether the category is active
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `productivity_categories` table
    - Add policy for authenticated users to read categories
    - Add policy for admin users to manage categories
*/

CREATE TABLE IF NOT EXISTS productivity_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  color text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE productivity_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view productivity categories"
  ON productivity_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert productivity categories"
  ON productivity_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'admin')
      )
    )
  );

CREATE POLICY "Admin users can update productivity categories"
  ON productivity_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'admin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'admin')
      )
    )
  );

CREATE POLICY "Admin users can delete productivity categories"
  ON productivity_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'admin')
      )
    )
  );

INSERT INTO productivity_categories (code, name, description, color) VALUES
  ('FO', 'FO - Folga', 'Funcionário em folga', '#10b981'),
  ('FE', 'FE - Férias', 'Funcionário em férias', '#3b82f6'),
  ('AT', 'AT - Atestado', 'Funcionário com atestado médico', '#f59e0b')
ON CONFLICT (code) DO NOTHING;

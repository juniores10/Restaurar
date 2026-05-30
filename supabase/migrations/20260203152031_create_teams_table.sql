/*
  # Create Teams Table

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text) - Team name
      - `description` (text) - Team description
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Changes to Existing Tables
    - `employees`
      - Add `team_id` (uuid, foreign key to teams)
  
  3. Security
    - Enable RLS on `teams` table
    - Add policies for authenticated users to read teams
    - Add policies for admins to manage teams
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add team_id to employees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read teams
CREATE POLICY "Authenticated users can view teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to insert teams
CREATE POLICY "Admins can insert teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gerente')
      )
    )
  );

-- Allow admins to update teams
CREATE POLICY "Admins can update teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gerente')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gerente')
      )
    )
  );

-- Allow admins to delete teams
CREATE POLICY "Admins can delete teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gerente')
      )
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active);

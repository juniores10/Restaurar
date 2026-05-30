/*
  # Create Teams Table (Fix Missing Table)

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
    - Add SELECT policy for authenticated users
    - Add INSERT/UPDATE/DELETE policies for admins
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

CREATE POLICY "Admins can update teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

CREATE POLICY "Admins can delete teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active);

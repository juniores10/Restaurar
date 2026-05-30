/*
  # Create initial schema for reports management system

  1. New Tables
    - `departments` - Departamentos/Setores da organização
    - `user_profiles` - Perfil do usuário com departamento associado
    - `reports` - Relatórios gerados/importados

  2. Security
    - Enable RLS on all tables
    - Add policies for users to view only their department's data
    - Add policies for editing and deleting their own records

  3. Important Notes
    - Users are authenticated via Supabase Auth
    - Each user is linked to a department via user_profiles
    - Reports are associated with departments and can be viewed/edited by department members
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  data jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view reports from their department"
  ON reports FOR SELECT
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create reports in their department"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    department_id = (
      SELECT department_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update reports in their department"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    department_id = (
      SELECT department_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reports in their department"
  ON reports FOR DELETE
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

/*
  # Employee Management System - Database Schema

  1. New Tables
    - `user_types`
      - `id` (integer, primary key) - User type identifier
      - `name` (text) - Type name (Admin, Manager, Employee)
      - `description` (text) - Type description
      - `created_at` (timestamptz) - Creation timestamp
    
    - `employees`
      - `id` (uuid, primary key) - Employee unique identifier
      - `auth_user_id` (uuid) - Reference to Supabase auth.users
      - `full_name` (text) - Employee full name
      - `email` (text, unique) - Employee email
      - `user_type_id` (integer) - Reference to user_types
      - `photo_url` (text) - Employee photo URL
      - `birth_date` (date) - Employee birth date
      - `remember_login` (boolean) - Remember login preference
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Employees can only view their own data unless they're admin/manager
*/

-- Create user_types table
CREATE TABLE IF NOT EXISTS user_types (
  id integer PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  user_type_id integer REFERENCES user_types(id) DEFAULT 3,
  photo_url text,
  birth_date date,
  remember_login boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policies for user_types (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view user types"
  ON user_types FOR SELECT
  TO authenticated
  USING (true);

-- Policies for employees
CREATE POLICY "Employees can view own profile"
  ON employees FOR SELECT
  TO authenticated
  USING (
    auth.uid() = auth_user_id
  );

CREATE POLICY "Employees can update own profile"
  ON employees FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

CREATE POLICY "Admins can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

CREATE POLICY "Admins can update all employees"
  ON employees FOR UPDATE
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

CREATE POLICY "Admins can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
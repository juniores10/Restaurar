/*
  # Fix Sector Productivity RLS Policies
  
  1. Changes
    - Drop existing restrictive RLS policies
    - Create new permissive policy for authenticated users to view all records
    - Maintain admin-only policy for modifications
  
  2. Security
    - All authenticated users can view productivity records
    - Only administrators can insert, update, or delete records
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Employees can view same department productivity records" ON sector_productivity_records;
DROP POLICY IF EXISTS "Admins can manage sector productivity records" ON sector_productivity_records;

-- Create new permissive SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can view all productivity records"
  ON sector_productivity_records
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for admins to manage records
CREATE POLICY "Admins can manage productivity records"
  ON sector_productivity_records
  FOR ALL
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

/*
  # Fix Sector Productivity Records RLS for All Sector Employees

  1. Changes
    - Drop the existing restrictive policy that only allows employees to see their own data
    - Create a new policy that allows employees to see all records from their department/sector
    - This enables the productivity ranking to show all colleagues

  2. Security
    - Employees can only see records from their own department (sector)
    - Uses department_id from employees table to determine access
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Employees can view own sector productivity records" ON sector_productivity_records;
DROP POLICY IF EXISTS "Employees can view same sector productivity records" ON sector_productivity_records;

-- Create a new policy that allows employees to see all records from their department
CREATE POLICY "Employees can view same department productivity records"
  ON sector_productivity_records
  FOR SELECT
  TO authenticated
  USING (
    sector_id IN (
      SELECT e.department_id 
      FROM employees e 
      WHERE e.auth_user_id = auth.uid()
      AND e.department_id IS NOT NULL
    )
    OR
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  );

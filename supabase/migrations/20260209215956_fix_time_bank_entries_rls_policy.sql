/*
  # Fix time_bank_entries RLS policy
  
  1. Changes
    - Update RLS policy to use correct user type names ('Administrador', 'Gestor')
    - Previously used incorrect names ('admin', 'manager')
  
  2. Security
    - Admins and managers can manage all time bank entries
    - Employees can read their own entries
*/

DROP POLICY IF EXISTS "Admins can manage time bank entries" ON time_bank_entries;

CREATE POLICY "Admins can manage time bank entries"
  ON time_bank_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  );

/*
  # Fix time_records DELETE policy to include Gestor

  1. Changes
    - Drop existing DELETE policy that only allows Administrador and Lider
    - Create new DELETE policy that also allows Gestor role
  
  2. Security
    - Authenticated users with Administrador, Gestor, or Lider roles can delete time records
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'time_records' 
    AND policyname = 'Admins can delete time records'
  ) THEN
    DROP POLICY "Admins can delete time records" ON time_records;
  END IF;
END $$;

CREATE POLICY "Admins managers leaders can delete time records"
  ON time_records
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      JOIN user_types ON employees.user_type_id = user_types.id
      WHERE employees.auth_user_id = auth.uid()
      AND user_types.name = ANY(ARRAY['Administrador', 'Gestor', 'Líder'])
    )
  );

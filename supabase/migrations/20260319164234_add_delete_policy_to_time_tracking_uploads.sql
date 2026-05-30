/*
  # Add delete policy to time_tracking_uploads

  1. Security Changes
    - Add DELETE policy for Administrador, Gestor, and Lider users
    - Allows authorized users to remove upload history records

  2. Important Notes
    - Only admins, managers, and leaders can delete upload records
    - Matches existing INSERT/UPDATE/SELECT policy patterns
*/

CREATE POLICY "Admins and managers can delete uploads"
  ON time_tracking_uploads
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      JOIN user_types ON employees.user_type_id = user_types.id
      WHERE employees.auth_user_id = auth.uid()
      AND user_types.name IN ('Administrador', 'Gestor', 'Líder')
    )
  );

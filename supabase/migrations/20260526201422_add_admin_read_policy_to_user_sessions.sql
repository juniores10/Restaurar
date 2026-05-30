/*
  # Add admin read access to user_sessions

  1. Security Changes
    - Add SELECT policy for admins/managers/leaders (user_type_id IN 1,2,5) to read all sessions
    - This allows the "Usuarios Online / Historico de Sessoes" feature

  2. Notes
    - Only admins, managers, and leaders can view all session history
    - Regular employees still only see their own sessions
*/

-- Add policy for admins to view all sessions
CREATE POLICY "Admins can view all sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  );

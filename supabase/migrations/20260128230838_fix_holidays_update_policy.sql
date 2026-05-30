/*
  # Fix Holidays Update Policy

  1. Changes
    - Drop the existing "Admins can update holidays" policy
    - Create a new policy without WITH CHECK restrictions
    - Allow admins to update any field including status changes

  2. Security
    - Only admins (user_type_id 1 or 2) can update holidays
    - Removes WITH CHECK that was blocking status updates
*/

DROP POLICY IF EXISTS "Admins can update holidays" ON holidays;

CREATE POLICY "Admins can update holidays"
  ON holidays FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

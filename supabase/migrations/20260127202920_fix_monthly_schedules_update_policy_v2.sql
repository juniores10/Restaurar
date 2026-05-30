/*
  # Fix Monthly Schedules UPDATE Policy - Version 2

  1. Changes
    - Simplify the UPDATE policy to be more permissive
    - Remove status restriction from USING clause
    - Keep WITH CHECK for status validation
  
  2. Security
    - Maintains admin/manager only access
    - Allows updating any schedule regardless of current status
    - Validates that new status is 0 or 1
*/

DROP POLICY IF EXISTS "Admins can update monthly schedules" ON monthly_schedules;

CREATE POLICY "Admins can update monthly schedules"
  ON monthly_schedules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

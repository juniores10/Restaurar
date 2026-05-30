/*
  # Fix Monthly Schedules Delete Policy

  1. Changes
    - Update the WITH CHECK clause for monthly_schedules UPDATE policy
    - Allow admins and managers to set status to 1 (logical delete)
  
  2. Security
    - Maintains admin/manager only access
    - Allows status updates between 0 and 1
*/

DROP POLICY IF EXISTS "Admins can update monthly schedules" ON monthly_schedules;

CREATE POLICY "Admins can update monthly schedules"
  ON monthly_schedules FOR UPDATE
  TO authenticated
  USING (
    status = 0 AND
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  )
  WITH CHECK (
    status IN (0, 1) AND
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

/*
  # Fix monthly_schedules UPDATE policy

  1. Changes
    - Drop existing UPDATE policy that has overly restrictive WITH CHECK
    - Create new UPDATE policy with proper WITH CHECK condition
    - The USING clause ensures only admins/managers can update
    - The WITH CHECK allows updating to any valid status
  
  2. Security
    - Maintains RLS protection
    - Only admins and managers can perform updates
    - Allows status changes without blocking
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can update monthly schedules" ON monthly_schedules;

-- Create new policy with proper WITH CHECK
CREATE POLICY "Admins can update monthly schedules"
  ON monthly_schedules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  )
  WITH CHECK (true);

/*
  # Fix Monthly Schedules Policies for Logical Delete

  1. Changes
    - Update SELECT policy to allow admins to see all schedules (status 0 and 1)
    - Employees still only see active schedules (status 0)
    - This allows UPDATE to status = 1 to work correctly
  
  2. Security
    - Admins can view all schedules (active and deleted)
    - Regular employees only see active schedules (status 0)
    - Maintains proper access control
*/

-- Drop and recreate the SELECT policy
DROP POLICY IF EXISTS "Admins can view all monthly schedules" ON monthly_schedules;

CREATE POLICY "Admins can view all monthly schedules"
  ON monthly_schedules FOR SELECT
  TO authenticated
  USING (
    -- Admins and managers can see all schedules (any status)
    (
      EXISTS (
        SELECT 1 FROM employees e
        WHERE e.auth_user_id = auth.uid()
        AND e.user_type_id IN (1, 2)
      )
    )
    OR
    -- Regular employees can only see active schedules they're part of
    (
      status = 0 AND
      EXISTS (
        SELECT 1 FROM schedule_employees se
        JOIN employees e ON se.employee_id = e.id
        WHERE se.schedule_id = monthly_schedules.id
        AND e.auth_user_id = auth.uid()
      )
    )
  );

-- Ensure UPDATE policy is correct
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

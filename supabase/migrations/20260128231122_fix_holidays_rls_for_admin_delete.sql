/*
  # Fix Holidays RLS for Admin Operations

  1. Changes
    - Add a new SELECT policy specifically for admins
    - Admins can view ALL holidays (including deleted ones with status = 1)
    - Regular users can only view active holidays (status = 0)

  2. Security
    - Admins (user_type_id 1 or 2) can see all records
    - Regular authenticated users can only see active records
    - This allows admins to perform UPDATE operations that change status

  3. Why This Fix Works
    - When an admin updates a holiday to status = 1 (soft delete)
    - PostgreSQL checks if the user can still SELECT the record after UPDATE
    - With this new policy, admins can see records with any status
    - Therefore the UPDATE operation is allowed
*/

-- Create admin-specific SELECT policy
CREATE POLICY "Admins can view all holidays including deleted"
  ON holidays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

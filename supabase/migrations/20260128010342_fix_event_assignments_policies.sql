/*
  # Fix Event Assignments Policies
  
  1. Changes
    - Remove the ALL policy
    - Create separate policies for SELECT, INSERT, UPDATE, DELETE
*/

DROP POLICY IF EXISTS "Admins can manage event assignments" ON event_assignments;
DROP POLICY IF EXISTS "Admins can select event assignments" ON event_assignments;
DROP POLICY IF EXISTS "Admins can insert event assignments" ON event_assignments;
DROP POLICY IF EXISTS "Admins can update event assignments" ON event_assignments;
DROP POLICY IF EXISTS "Admins can delete event assignments" ON event_assignments;

CREATE POLICY "Admins can select event assignments"
  ON event_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can insert event assignments"
  ON event_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can update event assignments"
  ON event_assignments
  FOR UPDATE
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

CREATE POLICY "Admins can delete event assignments"
  ON event_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );
/*
  # Fix Calendar Events Policies - Remove duplicate ALL policy

  1. Changes
    - Drop the ALL policy that may be causing conflicts
    - Ensure proper separate policies for SELECT, INSERT, UPDATE, DELETE
*/

DROP POLICY IF EXISTS "Admins can manage calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Admins can view all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Admins can insert calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Admins can update calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Admins can delete calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Employees can view events assigned to them" ON calendar_events;
DROP POLICY IF EXISTS "Employees can view assigned events" ON calendar_events;

CREATE POLICY "Admins can select calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can insert calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can update calendar events"
  ON calendar_events
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

CREATE POLICY "Admins can delete calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Employees can view assigned events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_assignments ea
      JOIN employees e ON ea.employee_id = e.id
      WHERE ea.event_id = calendar_events.id
      AND e.auth_user_id = auth.uid()
    )
  );
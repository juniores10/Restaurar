/*
  # Create Schedule System - RLS Policies

  Security policies for schedule system tables
*/

CREATE POLICY "Authenticated users can view active shift times"
  ON shift_times FOR SELECT
  TO authenticated
  USING (status = 0);

CREATE POLICY "Admin users can manage shift times"
  ON shift_times FOR ALL
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

CREATE POLICY "Authenticated users can view active day options"
  ON day_options FOR SELECT
  TO authenticated
  USING (status = 0);

CREATE POLICY "Admin users can manage day options"
  ON day_options FOR ALL
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

CREATE POLICY "Authenticated users can view schedules they are part of"
  ON schedules FOR SELECT
  TO authenticated
  USING (
    status = 0 AND (
      EXISTS (
        SELECT 1 FROM employees e
        WHERE e.auth_user_id = auth.uid()
        AND e.user_type_id IN (1, 2)
      )
      OR
      EXISTS (
        SELECT 1 FROM schedule_employees se
        JOIN employees e ON se.employee_id = e.id
        WHERE se.schedule_id = schedules.id
        AND e.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin users can insert schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admin users can update schedules"
  ON schedules FOR UPDATE
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

CREATE POLICY "Admin users can delete schedules"
  ON schedules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Authenticated users can view schedule employees"
  ON schedule_employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
    OR
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.id = schedule_employees.employee_id
    )
  );

CREATE POLICY "Admin users can insert schedule employees"
  ON schedule_employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admin users can delete schedule employees"
  ON schedule_employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Authenticated users can view their schedule entries"
  ON schedule_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
    OR
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.id = schedule_entries.employee_id
    )
  );

CREATE POLICY "Admin users can insert schedule entries"
  ON schedule_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admin users can update schedule entries"
  ON schedule_entries FOR UPDATE
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

CREATE POLICY "Admin users can delete schedule entries"
  ON schedule_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

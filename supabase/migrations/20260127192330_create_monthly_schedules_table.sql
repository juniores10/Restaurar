/*
  # Create Monthly Schedules Table

  1. New Tables
    - `monthly_schedules` - Monthly schedule headers for team shifts

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

DROP POLICY IF EXISTS "Authenticated users can view schedules they are part of" ON schedules;

DROP TABLE IF EXISTS schedule_entries CASCADE;
DROP TABLE IF EXISTS schedule_employees CASCADE;

CREATE TABLE IF NOT EXISTS monthly_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES data_types(id),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  status integer DEFAULT 0,
  created_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE monthly_schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE schedule_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES monthly_schedules(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(schedule_id, employee_id)
);

ALTER TABLE schedule_employees ENABLE ROW LEVEL SECURITY;

CREATE TABLE schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES monthly_schedules(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  day integer NOT NULL CHECK (day >= 1 AND day <= 31),
  shift_time_id uuid REFERENCES shift_times(id),
  day_option_id uuid REFERENCES day_options(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(schedule_id, employee_id, day)
);

ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all monthly schedules"
  ON monthly_schedules FOR SELECT
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
        WHERE se.schedule_id = monthly_schedules.id
        AND e.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can insert monthly schedules"
  ON monthly_schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

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

CREATE POLICY "Admins can delete monthly schedules"
  ON monthly_schedules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Users can view schedule employees"
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

CREATE POLICY "Admins can insert schedule employees"
  ON schedule_employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can delete schedule employees"
  ON schedule_employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Users can view schedule entries"
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

CREATE POLICY "Admins can insert schedule entries"
  ON schedule_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can update schedule entries"
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

CREATE POLICY "Admins can delete schedule entries"
  ON schedule_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

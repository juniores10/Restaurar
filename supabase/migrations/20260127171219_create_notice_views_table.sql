/*
  # Create notice views tracking table

  1. New Tables
    - `notice_views`
      - `id` (uuid, primary key)
      - `notice_id` (uuid, foreign key to notices)
      - `employee_id` (uuid, foreign key to employees)
      - `viewed_at` (timestamp)

  2. Security
    - Enable RLS on `notice_views` table
    - Add policy for employees to insert their own views
    - Add policy for employees to read their own views
    - Add policy for admins to read all views

  3. Notes
    - Unique constraint on notice_id + employee_id to prevent duplicate views
    - This table tracks when employees view notices
*/

CREATE TABLE IF NOT EXISTS notice_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id uuid NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(notice_id, employee_id)
);

ALTER TABLE notice_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can insert their own views"
  ON notice_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can read their own views"
  ON notice_views
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all views"
  ON notice_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id = 1
    )
  );

CREATE INDEX IF NOT EXISTS idx_notice_views_notice_id ON notice_views(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_views_employee_id ON notice_views(employee_id);
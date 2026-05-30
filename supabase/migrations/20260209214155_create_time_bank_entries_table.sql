/*
  # Create time bank entries table

  1. New Tables
    - `time_bank_entries`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, FK to employees)
      - `entry_date` (date, not null)
      - `hours` (numeric, not null) - decimal hours (negative for deductions)
      - `reason` (text) - e.g., "Serão", "Serão noturno", "Serão 100%"
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `time_bank_entries`
    - Admin users can manage all entries
    - Authenticated users can read their own entries

  3. Notes
    - Stores "Lançamentos de banco de horas" data from PontoMais spreadsheets
    - Multiple entries per date are allowed (e.g., Serão + Serão noturno)
    - Unique constraint on employee_id + entry_date + reason to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS time_bank_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  hours numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_time_bank_entries_unique
  ON time_bank_entries (employee_id, entry_date, reason);

ALTER TABLE time_bank_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage time bank entries"
  ON time_bank_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "Employees can read own time bank entries"
  ON time_bank_entries
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

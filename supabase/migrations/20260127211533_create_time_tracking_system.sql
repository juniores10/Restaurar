/*
  # Create Time Tracking System

  1. New Tables
    - `time_records`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `record_date` (date)
      - `clock_in_1` (time) - First clock in
      - `clock_out_1` (time) - First clock out
      - `clock_in_2` (time) - Second clock in (lunch return)
      - `clock_out_2` (time) - Second clock out (end of day)
      - `total_hours` (numeric) - Total hours worked
      - `expected_hours` (numeric) - Expected hours for the day
      - `balance_hours` (numeric) - Difference (total - expected)
      - `observations` (text) - Any notes
      - `record_type` (text) - 'work', 'dayoff', 'vacation', 'absence', 'holiday'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `time_tracking_uploads`
      - `id` (uuid, primary key)
      - `uploaded_by` (uuid, foreign key to employees)
      - `upload_date` (timestamptz)
      - `file_name` (text)
      - `records_processed` (integer)
      - `status` (text) - 'processing', 'completed', 'failed'
      - `error_message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admins and managers can manage all records
    - Employees can only view their own records
*/

-- Create time_records table
CREATE TABLE IF NOT EXISTS time_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  clock_in_1 time,
  clock_out_1 time,
  clock_in_2 time,
  clock_out_2 time,
  total_hours numeric(5,2) DEFAULT 0,
  expected_hours numeric(5,2) DEFAULT 8,
  balance_hours numeric(5,2) DEFAULT 0,
  observations text,
  record_type text DEFAULT 'work' CHECK (record_type IN ('work', 'dayoff', 'vacation', 'absence', 'holiday')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, record_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_time_records_employee ON time_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_records_date ON time_records(record_date);
CREATE INDEX IF NOT EXISTS idx_time_records_employee_date ON time_records(employee_id, record_date);

-- Create time_tracking_uploads table
CREATE TABLE IF NOT EXISTS time_tracking_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  upload_date timestamptz DEFAULT now(),
  file_name text NOT NULL,
  records_processed integer DEFAULT 0,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create index for uploads
CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_by ON time_tracking_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploads_date ON time_tracking_uploads(upload_date);

-- Enable RLS
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_records

-- Admins and managers can view all records
CREATE POLICY "Admins and managers can view all time records"
  ON time_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gestor')
      )
    )
  );

-- Employees can view their own records
CREATE POLICY "Employees can view own time records"
  ON time_records
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Admins and managers can insert records
CREATE POLICY "Admins and managers can insert time records"
  ON time_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gestor')
      )
    )
  );

-- Admins and managers can update records
CREATE POLICY "Admins and managers can update time records"
  ON time_records
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gestor')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gestor')
      )
    )
  );

-- Admins can delete records
CREATE POLICY "Admins can delete time records"
  ON time_records
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name = 'Administrador'
      )
    )
  );

-- RLS Policies for time_tracking_uploads

-- Admins and managers can view all uploads
CREATE POLICY "Admins and managers can view all uploads"
  ON time_tracking_uploads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gestor')
      )
    )
  );

-- Admins and managers can insert uploads
CREATE POLICY "Admins and managers can insert uploads"
  ON time_tracking_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name IN ('Administrador', 'Gestor')
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_time_records_updated_at ON time_records;
CREATE TRIGGER trigger_update_time_records_updated_at
  BEFORE UPDATE ON time_records
  FOR EACH ROW
  EXECUTE FUNCTION update_time_records_updated_at();
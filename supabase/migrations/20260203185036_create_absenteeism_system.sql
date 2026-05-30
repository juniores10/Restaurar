/*
  # Create Absenteeism Tracking System

  1. New Tables
    - `absenteeism_uploads` - Tracks uploaded files for absenteeism analysis
      - `id` (uuid, primary key)
      - `uploaded_by` (uuid, references employees)
      - `file_name` (text)
      - `period_start` (date)
      - `period_end` (date)
      - `status` (text)
      - `records_count` (integer)
      - `created_at` (timestamptz)
    
    - `absenteeism_records` - Individual absence records
      - `id` (uuid, primary key)
      - `upload_id` (uuid, references absenteeism_uploads)
      - `employee_name` (text)
      - `employee_id_external` (text)
      - `sector` (text)
      - `unit` (text)
      - `position` (text)
      - `team` (text)
      - `record_date` (date)
      - `absence_type` (text) - falta, atestado, atraso, saida_antecipada, licenca, ferias, folga, feriado
      - `status` (text) - justificada, nao_justificada
      - `expected_hours` (numeric)
      - `absent_hours` (numeric)
      - `worked_hours` (numeric)
      - `reason` (text)
      - `hourly_cost` (numeric)
      - `created_at` (timestamptz)
    
    - `absenteeism_settings` - Configuration for absenteeism analysis
      - `id` (uuid, primary key)
      - `setting_key` (text, unique)
      - `setting_value` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated admin/manager access
*/

-- Create absenteeism_uploads table
CREATE TABLE IF NOT EXISTS absenteeism_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  period_start date,
  period_end date,
  status text DEFAULT 'processing',
  records_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create absenteeism_records table
CREATE TABLE IF NOT EXISTS absenteeism_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES absenteeism_uploads(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  employee_id_external text,
  sector text,
  unit text,
  position text,
  team text,
  shift text,
  record_date date NOT NULL,
  absence_type text NOT NULL,
  status text DEFAULT 'nao_justificada',
  expected_hours numeric(10,2) DEFAULT 0,
  absent_hours numeric(10,2) DEFAULT 0,
  worked_hours numeric(10,2) DEFAULT 0,
  overtime_hours numeric(10,2) DEFAULT 0,
  reason text,
  hourly_cost numeric(10,2),
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create absenteeism_settings table
CREATE TABLE IF NOT EXISTS absenteeism_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_upload_id ON absenteeism_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_date ON absenteeism_records(record_date);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_employee ON absenteeism_records(employee_name);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_type ON absenteeism_records(absence_type);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_sector ON absenteeism_records(sector);
CREATE INDEX IF NOT EXISTS idx_absenteeism_records_unit ON absenteeism_records(unit);

-- Enable RLS
ALTER TABLE absenteeism_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE absenteeism_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE absenteeism_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for absenteeism_uploads
CREATE POLICY "Admins and managers can view absenteeism uploads"
  ON absenteeism_uploads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can insert absenteeism uploads"
  ON absenteeism_uploads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can update absenteeism uploads"
  ON absenteeism_uploads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can delete absenteeism uploads"
  ON absenteeism_uploads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

-- RLS Policies for absenteeism_records
CREATE POLICY "Admins and managers can view absenteeism records"
  ON absenteeism_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can insert absenteeism records"
  ON absenteeism_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can update absenteeism records"
  ON absenteeism_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "Admins and managers can delete absenteeism records"
  ON absenteeism_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gerente')
    )
  );

-- RLS Policies for absenteeism_settings
CREATE POLICY "Admins can view absenteeism settings"
  ON absenteeism_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  );

CREATE POLICY "Admins can manage absenteeism settings"
  ON absenteeism_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'Administrador'
    )
  );

-- Insert default settings
INSERT INTO absenteeism_settings (setting_key, setting_value) VALUES
  ('recurrence_threshold', '{"value": 3, "period_days": 30}'),
  ('target_absenteeism_rate', '{"value": 3.0}'),
  ('default_hourly_cost', '{"value": 25.0}'),
  ('absence_types', '{"types": ["falta", "atestado", "atraso", "saida_antecipada", "licenca", "ferias", "folga", "feriado", "compensacao"]}')
ON CONFLICT (setting_key) DO NOTHING;

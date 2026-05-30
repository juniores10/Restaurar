/*
  # Create Gate Control System

  1. New Tables
    - `gate_control_requests`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees) - Colaborador solicitando saída/entrada
      - `request_type` (text) - 'exit' ou 'entry'
      - `reason` (text) - Motivo da saída/entrada
      - `requested_datetime` (timestamptz) - Data/hora solicitada
      - `status` (text) - 'pending', 'authorized', 'validated', 'rejected'
      - `authorized_by` (uuid, references employees) - Gestor/admin que autorizou
      - `authorized_at` (timestamptz) - Quando foi autorizado
      - `authorization_notes` (text) - Observações do autorizador
      - `validated_by` (uuid, references employees) - RH que validou
      - `validated_at` (timestamptz) - Quando foi validado
      - `validation_notes` (text) - Observações do validador
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `gate_control_requests` table
    - Add policies for:
      - Employees can view their own requests
      - Managers/Admins can view and authorize all requests
      - HR (Administrador) can validate authorized requests
      - Terceirizado can view all requests (for portaria view)
*/

CREATE TABLE IF NOT EXISTS gate_control_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('entry', 'exit')),
  reason text NOT NULL,
  requested_datetime timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'validated', 'rejected')),
  authorized_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  authorized_at timestamptz,
  authorization_notes text,
  validated_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  validated_at timestamptz,
  validation_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gate_control_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own gate requests"
  ON gate_control_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers and Admins can view all gate requests"
  ON gate_control_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_user_id = auth.uid()
      AND user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Terceirizado can view all gate requests"
  ON gate_control_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_user_id = auth.uid()
      AND user_type_id = 4
    )
  );

CREATE POLICY "Employees can create own gate requests"
  ON gate_control_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers and Admins can authorize gate requests"
  ON gate_control_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_user_id = auth.uid()
      AND user_type_id IN (1, 2)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_user_id = auth.uid()
      AND user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can validate gate requests"
  ON gate_control_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_user_id = auth.uid()
      AND user_type_id = 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_user_id = auth.uid()
      AND user_type_id = 1
    )
  );

CREATE INDEX IF NOT EXISTS idx_gate_control_requests_employee ON gate_control_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_gate_control_requests_status ON gate_control_requests(status);
CREATE INDEX IF NOT EXISTS idx_gate_control_requests_datetime ON gate_control_requests(requested_datetime);

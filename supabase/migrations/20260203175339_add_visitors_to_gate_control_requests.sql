/*
  # Add Visitor Support to Gate Control Requests

  1. Changes
    - Add `person_type` column to store 'employee' or 'visitor'
    - Add `visitor_id` column to reference visitors table
    - Make `employee_id` nullable since now we can have visitor requests
    - Update constraints to ensure either employee_id or visitor_id is set
    - Add new policies to allow visitors to be referenced in requests

  2. Security
    - Update RLS policies to handle both employee and visitor requests
    - Maintain same security model but expanded for visitors
*/

-- Add new columns
ALTER TABLE gate_control_requests 
  ADD COLUMN IF NOT EXISTS person_type text DEFAULT 'employee' CHECK (person_type IN ('employee', 'visitor')),
  ADD COLUMN IF NOT EXISTS visitor_id uuid REFERENCES visitors(id) ON DELETE CASCADE;

-- Make employee_id nullable now that we have visitors
ALTER TABLE gate_control_requests ALTER COLUMN employee_id DROP NOT NULL;

-- Add constraint to ensure either employee_id or visitor_id is set (but not both)
ALTER TABLE gate_control_requests
  ADD CONSTRAINT check_person_id 
  CHECK (
    (person_type = 'employee' AND employee_id IS NOT NULL AND visitor_id IS NULL) OR
    (person_type = 'visitor' AND visitor_id IS NOT NULL AND employee_id IS NULL)
  );

-- Update the existing "Employees can create own gate requests" policy
-- to allow creating requests for employees only
DROP POLICY IF EXISTS "Employees can create own gate requests" ON gate_control_requests;

CREATE POLICY "Employees can create own gate requests"
  ON gate_control_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    person_type = 'employee' AND
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Add policy for admins/managers to create requests for anyone (employee or visitor)
CREATE POLICY "Admins and managers can create gate requests for anyone"
  ON gate_control_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_user_id = auth.uid()
      AND user_type_id IN (1, 2)
    )
  );

-- Update select policies to include visitor-based requests
DROP POLICY IF EXISTS "Employees can view own gate requests" ON gate_control_requests;

CREATE POLICY "Employees can view own gate requests"
  ON gate_control_requests
  FOR SELECT
  TO authenticated
  USING (
    (person_type = 'employee' AND employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ))
  );

-- Add index on visitor_id
CREATE INDEX IF NOT EXISTS idx_gate_control_requests_visitor ON gate_control_requests(visitor_id);

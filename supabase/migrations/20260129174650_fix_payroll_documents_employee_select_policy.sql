/*
  # Fix Payroll Documents RLS for Employees

  1. Changes
    - Add SELECT policy for employees to view documents assigned to them
    - This allows employees to see payroll_documents when joined with their assignments
    
  2. Security
    - Employees can only view documents that are explicitly assigned to them
    - Policy checks through payroll_document_assignments table
*/

-- Add policy for employees to view their assigned documents
CREATE POLICY "Colaboradores podem visualizar documentos atribuídos a eles"
  ON payroll_documents
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT document_id 
      FROM payroll_document_assignments
      WHERE employee_id IN (
        SELECT id 
        FROM employees 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

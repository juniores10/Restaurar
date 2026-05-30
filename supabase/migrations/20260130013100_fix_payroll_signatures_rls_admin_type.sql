/*
  # Fix Payroll Signatures RLS Policy for Admin Access

  1. Changes
    - Drop existing "Admins can view all signatures" policy
    - Create new policy using correct user type description "Acesso total ao sistema"
    - This fixes the issue where admins couldn't view signature audit data
  
  2. Security
    - Maintains security by checking authenticated users
    - Only allows users with "Acesso total ao sistema" type to view all signatures
    - Employees can still view their own signatures
*/

-- Drop the old policy with incorrect user type
DROP POLICY IF EXISTS "Admins can view all signatures" ON payroll_signatures;

-- Create new policy with correct user type
CREATE POLICY "Admins can view all signatures"
  ON payroll_signatures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
        AND ut.description = 'Acesso total ao sistema'
    )
  );

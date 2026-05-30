/*
  # Standardize Admin Checks to Use user_types.name

  1. Changes
    - Update payroll_signatures admin policy to use ut.name = 'Administrador'
    - Update storage signature-selfies admin policy to use ut.name = 'Administrador'
    - This standardizes all policies to use the 'name' field instead of 'description'
  
  2. Security
    - Maintains same security level
    - Standardizes all admin checks across the system
*/

-- Fix payroll_signatures policy to use name field
DROP POLICY IF EXISTS "Admins can view all signatures" ON payroll_signatures;

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
        AND ut.name = 'Administrador'
    )
  );

-- Fix storage signature-selfies policy to use name field
DROP POLICY IF EXISTS "Admins can view all signature selfies" ON storage.objects;

CREATE POLICY "Admins can view all signature selfies"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'signature-selfies'
    AND EXISTS (
      SELECT 1
      FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
        AND ut.name = 'Administrador'
    )
  );

/*
  # Fix Signature Selfies Storage RLS Policy

  1. Changes
    - Drop existing "Admins can view all signature selfies" policy on storage.objects
    - Create new policy using correct user type description "Acesso total ao sistema"
    - This fixes the issue where admins couldn't view signature selfies
  
  2. Security
    - Maintains security by checking authenticated users
    - Only allows users with "Acesso total ao sistema" type to view all selfies
    - Employees can still view their own selfies
*/

-- Drop the old storage policy with incorrect user type
DROP POLICY IF EXISTS "Admins can view all signature selfies" ON storage.objects;

-- Create new storage policy with correct user type
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
        AND ut.description = 'Acesso total ao sistema'
    )
  );

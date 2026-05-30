/*
  # Fix RLS for Sector Productivity Records with Security Definer Function

  1. Changes
    - Create a security definer function to get sector IDs for current user
    - Drop and recreate the policy to use this function
    - This avoids circular reference in RLS policy

  2. Security
    - Function runs with definer permissions to bypass RLS during lookup
    - Employees can only view records from sectors they belong to
*/

-- Create a function to get sector IDs for the current user
CREATE OR REPLACE FUNCTION get_user_sector_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT spr.sector_id
  FROM sector_productivity_records spr
  INNER JOIN employees e ON e.id = spr.employee_id
  WHERE e.auth_user_id = auth.uid();
$$;

-- Drop the old policy that has circular reference
DROP POLICY IF EXISTS "Employees can view same sector productivity records" ON sector_productivity_records;

-- Create new policy using the security definer function
CREATE POLICY "Employees can view same sector productivity records"
  ON sector_productivity_records
  FOR SELECT
  TO authenticated
  USING (
    sector_id IN (SELECT get_user_sector_ids())
  );

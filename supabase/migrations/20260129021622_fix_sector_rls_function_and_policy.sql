/*
  # Fix Sector Productivity RLS Function and Policy

  1. Changes
    - Drop the existing policy that depends on the function
    - Recreate function with proper search_path and settings
    - Recreate the policy using the improved function

  2. Security
    - Function uses security definer to bypass RLS for the lookup
    - Only returns sector IDs from user's own productivity records
*/

-- Drop the policy first (it depends on the function)
DROP POLICY IF EXISTS "Employees can view same sector productivity records" ON sector_productivity_records;

-- Drop and recreate the function with proper settings
DROP FUNCTION IF EXISTS get_user_sector_ids();

CREATE FUNCTION get_user_sector_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT spr.sector_id
  FROM sector_productivity_records spr
  INNER JOIN employees e ON e.id = spr.employee_id
  WHERE e.auth_user_id = auth.uid()
    AND spr.sector_id IS NOT NULL;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_sector_ids() TO authenticated;

-- Recreate the policy using the function
CREATE POLICY "Employees can view same sector productivity records"
  ON sector_productivity_records
  FOR SELECT
  TO authenticated
  USING (
    sector_id IN (SELECT get_user_sector_ids())
  );

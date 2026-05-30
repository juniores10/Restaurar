/*
  # Update RLS Policies for Sample Data
  
  1. Changes
    - Update policies to allow viewing employees without auth_user_id (sample data)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Employees can view own profile" ON employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON employees;

-- Recreate policies with updated logic
CREATE POLICY "Employees can view own profile"
  ON employees FOR SELECT
  TO authenticated
  USING (
    auth.uid() = auth_user_id
  );

CREATE POLICY "All authenticated users can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);
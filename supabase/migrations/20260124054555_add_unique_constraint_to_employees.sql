/*
  # Add unique constraint to employees table
  
  1. Changes
    - Add unique constraint to auth_user_id column in employees table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_auth_user_id_key'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;
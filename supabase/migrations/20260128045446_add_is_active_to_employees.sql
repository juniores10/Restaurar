/*
  # Add is_active column to employees table

  1. Changes
    - Add `is_active` boolean column to `employees` table
      - Default value: true (for active employees)
      - Not null
    - Update existing records: set is_active = true where status = 0
  
  2. Purpose
    - Provide a clear boolean field to identify active employees
    - Simplifies queries in the application
*/

-- Add is_active column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE employees ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Update existing records: employees with status 0 are active
UPDATE employees
SET is_active = (status = 0)
WHERE is_active IS NULL OR is_active != (status = 0);
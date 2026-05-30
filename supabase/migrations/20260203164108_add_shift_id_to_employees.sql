/*
  # Add Shift Field to Employees

  1. Changes to Existing Tables
    - `employees`
      - Add `shift_id` (uuid, foreign key to shift_times) - Employee's work shift

  2. Notes
    - Allows employees to be assigned to specific shifts/work schedules
    - Foreign key relationship with shift_times table
    - Field is optional (nullable) as not all employees may have assigned shifts
*/

-- Add shift_id to employees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'shift_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN shift_id uuid REFERENCES shift_times(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employees_shift_id ON employees(shift_id);

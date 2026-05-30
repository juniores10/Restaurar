/*
  # Add Second Shift to Employees

  1. Changes to Existing Tables
    - `employees`
      - Add `shift_id_2` (uuid, nullable) - Second shift assignment for employees
      - Add foreign key constraint to `shift_times` table

  2. Notes
    - Allows employees to have up to 2 shifts assigned
    - Common use case: employees working different shifts on different days
    - Field is nullable as not all employees need a second shift
    - Maintains referential integrity with shift_times table
*/

-- Add shift_id_2 column to employees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'shift_id_2'
  ) THEN
    ALTER TABLE employees ADD COLUMN shift_id_2 uuid REFERENCES shift_times(id);
  END IF;
END $$;

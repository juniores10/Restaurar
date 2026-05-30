/*
  # Add Workplace Field to Employees

  1. Changes
    - Add `workplace_id` column to `employees` table
    - This field stores the workplace/location where the employee works
    - References the `locations` table with type 2 (workplaces)

  2. Security
    - No RLS changes needed as the column is part of the existing table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'workplace_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN workplace_id uuid REFERENCES locations(id);
  END IF;
END $$;

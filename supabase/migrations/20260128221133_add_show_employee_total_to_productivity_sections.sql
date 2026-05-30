/*
  # Add show_employee_total column to productivity_sections

  1. Changes
    - Add `show_employee_total` (boolean) column to productivity_sections table
    - Default to false for backward compatibility

  2. Notes
    - This column controls whether the "Total Colaborador" column is shown in the productivity table
    - Allows admins to configure per section whether to show employee totals
*/

-- Add show_employee_total column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productivity_sections' AND column_name = 'show_employee_total'
  ) THEN
    ALTER TABLE productivity_sections ADD COLUMN show_employee_total boolean DEFAULT false;
  END IF;
END $$;

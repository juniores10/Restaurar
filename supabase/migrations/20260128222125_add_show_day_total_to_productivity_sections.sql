/*
  # Add show_day_total column to productivity_sections

  1. Changes
    - Add `show_day_total` (boolean) column to productivity_sections table
    - Default to false for backward compatibility

  2. Notes
    - This column controls whether the "Total Dia" row is shown in the productivity table
    - The "Total Dia" row shows the sum of all values per day per employee
    - Allows admins to configure per section whether to show employee day totals
*/

-- Add show_day_total column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productivity_sections' AND column_name = 'show_day_total'
  ) THEN
    ALTER TABLE productivity_sections ADD COLUMN show_day_total boolean DEFAULT false;
  END IF;
END $$;

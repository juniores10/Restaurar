/*
  # Add Default Weekly Hours to System Settings

  1. Changes
    - Add `default_weekly_hours` column to `system_settings` table
      - Type: numeric (allows decimal hours like 44.0)
      - Default: 44 (Brazilian labor law standard)
      - Not null with default value
  
  2. Purpose
    - Store the default weekly working hours for all employees
    - Used for calculating time bank balances
    - Configurable by administrators
*/

-- Add default_weekly_hours column to system_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'default_weekly_hours'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN default_weekly_hours numeric DEFAULT 44 NOT NULL;
  END IF;
END $$;

-- Update existing settings row with default value
UPDATE system_settings
SET default_weekly_hours = 44
WHERE id = '00000000-0000-0000-0000-000000000001' AND default_weekly_hours IS NULL;
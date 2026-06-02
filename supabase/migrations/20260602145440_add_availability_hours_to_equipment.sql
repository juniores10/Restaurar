/*
  # Add availability hours to maintenance equipment

  1. Modified Tables
    - `maintenance_equipment`
      - `available_from` (time) - Start time the machine is available (e.g., 07:00)
      - `available_to` (time) - End time the machine is available (e.g., 17:00)

  2. Notes
    - These fields allow calculating total daily available hours for each machine
    - Default values are NULL (not configured yet)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_equipment' AND column_name = 'available_from'
  ) THEN
    ALTER TABLE maintenance_equipment ADD COLUMN available_from time DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_equipment' AND column_name = 'available_to'
  ) THEN
    ALTER TABLE maintenance_equipment ADD COLUMN available_to time DEFAULT NULL;
  END IF;
END $$;
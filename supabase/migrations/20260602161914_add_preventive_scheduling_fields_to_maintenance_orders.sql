/*
  # Add preventive maintenance scheduling fields

  1. Modified Tables
    - `maintenance_orders`
      - `scheduled_start` (timestamptz, nullable) - Scheduled start date for preventive maintenance
      - `scheduled_end` (timestamptz, nullable) - Scheduled end date for preventive maintenance
      - `scheduled_materials` (text[], nullable) - List of material names planned for the maintenance

  2. Notes
    - These fields are used when maintenance_type = 'Preventiva'
    - The status is set to 'Agendado' for preventive maintenance orders
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_orders' AND column_name = 'scheduled_start'
  ) THEN
    ALTER TABLE maintenance_orders ADD COLUMN scheduled_start timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_orders' AND column_name = 'scheduled_end'
  ) THEN
    ALTER TABLE maintenance_orders ADD COLUMN scheduled_end timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_orders' AND column_name = 'scheduled_materials'
  ) THEN
    ALTER TABLE maintenance_orders ADD COLUMN scheduled_materials text[];
  END IF;
END $$;
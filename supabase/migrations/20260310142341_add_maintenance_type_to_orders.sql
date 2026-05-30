/*
  # Add maintenance_type to maintenance_orders

  1. Changes
    - Adds `maintenance_type` column to `maintenance_orders` table
      - Values: 'Corretiva' | 'Preventiva'
      - Default: 'Corretiva'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_orders' AND column_name = 'maintenance_type'
  ) THEN
    ALTER TABLE maintenance_orders ADD COLUMN maintenance_type text NOT NULL DEFAULT 'Corretiva';
  END IF;
END $$;

/*
  # Add estimated purchase value to maintenance equipment

  1. Modified Tables
    - `maintenance_equipment`
      - `purchase_value` (numeric, default 0) - Estimated purchase value of the equipment in BRL

  2. Notes
    - Allows tracking the acquisition cost of each machine/equipment
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_equipment' AND column_name = 'purchase_value'
  ) THEN
    ALTER TABLE maintenance_equipment ADD COLUMN purchase_value numeric DEFAULT 0;
  END IF;
END $$;
/*
  # Add unit_price to maintenance_materials

  1. Modified Tables
    - `maintenance_materials`
      - `unit_price` (numeric, default 0) - Unit price of the material in BRL

  2. Notes
    - Allows tracking the cost of each material/supply item
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_materials' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE maintenance_materials ADD COLUMN unit_price numeric DEFAULT 0;
  END IF;
END $$;
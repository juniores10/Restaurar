/*
  # Add new fields to maintenance_materials

  ## Changes
  - Adds `equipment_id` (uuid, FK to maintenance_equipment) — links material to an equipment
  - Adds `warehouse_code` (text) — codigo do almoxarifado
  - Adds `description` (text) — descricao detalhada do material

  ## Security
  - No RLS changes required (inherits existing policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_materials' AND column_name = 'equipment_id'
  ) THEN
    ALTER TABLE maintenance_materials ADD COLUMN equipment_id uuid REFERENCES maintenance_equipment(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_materials' AND column_name = 'warehouse_code'
  ) THEN
    ALTER TABLE maintenance_materials ADD COLUMN warehouse_code text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_materials' AND column_name = 'description'
  ) THEN
    ALTER TABLE maintenance_materials ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

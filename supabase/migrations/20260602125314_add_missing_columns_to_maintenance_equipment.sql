/*
  # Add missing columns to maintenance_equipment

  Adds manufacturer, serial_number, model, installation_date and inactivated_at
  columns that the application expects but were not present in the table.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_equipment' AND column_name = 'manufacturer') THEN
    ALTER TABLE maintenance_equipment ADD COLUMN manufacturer text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_equipment' AND column_name = 'serial_number') THEN
    ALTER TABLE maintenance_equipment ADD COLUMN serial_number text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_equipment' AND column_name = 'model') THEN
    ALTER TABLE maintenance_equipment ADD COLUMN model text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_equipment' AND column_name = 'installation_date') THEN
    ALTER TABLE maintenance_equipment ADD COLUMN installation_date date NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_equipment' AND column_name = 'inactivated_at') THEN
    ALTER TABLE maintenance_equipment ADD COLUMN inactivated_at timestamptz NULL;
  END IF;
END $$;

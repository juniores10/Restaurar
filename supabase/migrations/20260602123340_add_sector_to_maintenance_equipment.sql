/*
  # Add sector column to maintenance_equipment

  Adds a text column `sector` to store the sector name directly,
  replacing the location_id FK-based field in the UI.
  The location_id column is kept for backwards compatibility.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_equipment' AND column_name = 'sector'
  ) THEN
    ALTER TABLE maintenance_equipment ADD COLUMN sector text DEFAULT '';
  END IF;
END $$;

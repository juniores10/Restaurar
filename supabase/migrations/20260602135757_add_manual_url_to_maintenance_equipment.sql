/*
  # Add manual_url column to maintenance_equipment

  Adds a text column to store the URL of the uploaded equipment manual PDF.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_equipment' AND column_name = 'manual_url'
  ) THEN
    ALTER TABLE maintenance_equipment ADD COLUMN manual_url text DEFAULT '';
  END IF;
END $$;

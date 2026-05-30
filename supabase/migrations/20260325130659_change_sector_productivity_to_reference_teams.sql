/*
  # Change sector productivity tables to reference teams

  1. Modified Tables
    - `sector_productivity_uploads`
      - Changed `sector_id` foreign key from `data_types(id)` to `teams(id)`
    - `sector_productivity_records`
      - Changed `sector_id` foreign key from `data_types(id)` to `teams(id)`

  2. Notes
    - Both tables had zero records, so no data migration needed
    - The dropdown in Produtividade por Departamento/Setor will now show teams instead of departments
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sector_productivity_uploads_sector_id_fkey'
  ) THEN
    ALTER TABLE sector_productivity_uploads DROP CONSTRAINT sector_productivity_uploads_sector_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sector_productivity_records_sector_id_fkey'
  ) THEN
    ALTER TABLE sector_productivity_records DROP CONSTRAINT sector_productivity_records_sector_id_fkey;
  END IF;
END $$;

ALTER TABLE sector_productivity_uploads
  ADD CONSTRAINT sector_productivity_uploads_sector_id_fkey
  FOREIGN KEY (sector_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE sector_productivity_records
  ADD CONSTRAINT sector_productivity_records_sector_id_fkey
  FOREIGN KEY (sector_id) REFERENCES teams(id) ON DELETE CASCADE;

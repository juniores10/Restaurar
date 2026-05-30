/*
  # Revert sector productivity foreign keys back to data_types

  1. Steps
    - Drop existing FK constraints (pointing to teams)
    - Remap records from team IDs to department IDs
    - Delete orphan uploads with no matching department
    - Add new FK constraints pointing to data_types

  2. Data Migration
    - Corte: team c0fe5182 -> data_types ea929669
    - Cola uploads (team 34948c13): deleted (not a department)

  3. Notes
    - The dropdown shows departments from data_types (type=2), not teams
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

UPDATE sector_productivity_records
SET sector_id = 'ea929669-dbba-469a-b995-db4421f4ff05'
WHERE sector_id = 'c0fe5182-8aa0-4770-a104-60f8878fc07f';

UPDATE sector_productivity_uploads
SET sector_id = 'ea929669-dbba-469a-b995-db4421f4ff05'
WHERE sector_id = 'c0fe5182-8aa0-4770-a104-60f8878fc07f';

DELETE FROM sector_productivity_uploads
WHERE sector_id = '34948c13-b03a-4e22-a3b6-a69e98b24006';

ALTER TABLE sector_productivity_uploads
  ADD CONSTRAINT sector_productivity_uploads_sector_id_fkey
  FOREIGN KEY (sector_id) REFERENCES data_types(id) ON DELETE CASCADE;

ALTER TABLE sector_productivity_records
  ADD CONSTRAINT sector_productivity_records_sector_id_fkey
  FOREIGN KEY (sector_id) REFERENCES data_types(id) ON DELETE CASCADE;
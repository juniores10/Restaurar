/*
  # Add hourly rate field to maintenance technicians

  1. Modified Tables
    - `maintenance_technicians`
      - `hourly_rate` (numeric, default 0) - Average hourly cost in R$ for the technician

  2. Notes
    - This field stores the average cost per hour worked for each technician
    - Default value is 0, meaning no cost defined yet
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_technicians' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE maintenance_technicians ADD COLUMN hourly_rate numeric DEFAULT 0;
  END IF;
END $$;
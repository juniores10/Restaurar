/*
  # Add location_id and reference_month to time_tracking_uploads

  1. Modified Tables
    - `time_tracking_uploads`
      - `location_id` (uuid, nullable) - references the workplace location for this upload
      - `reference_month` (text, nullable) - the month this upload refers to (YYYY-MM format)
      - `total_employees_processed` (integer, nullable) - number of employees in the upload

  2. Notes
    - Existing records will have NULL for new columns
    - These fields help track which uploads correspond to which month and location
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_tracking_uploads' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE time_tracking_uploads ADD COLUMN location_id uuid REFERENCES locations(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_tracking_uploads' AND column_name = 'reference_month'
  ) THEN
    ALTER TABLE time_tracking_uploads ADD COLUMN reference_month text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_tracking_uploads' AND column_name = 'total_employees_processed'
  ) THEN
    ALTER TABLE time_tracking_uploads ADD COLUMN total_employees_processed integer DEFAULT 0;
  END IF;
END $$;
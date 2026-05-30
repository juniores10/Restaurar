/*
  # Add clock location fields to time_records

  1. New Columns
    - `clock_in_1_location` (text): Location text for first entry (e.g., "FO BH")
    - `clock_out_1_location` (text): Location text for first exit
    - `clock_in_2_location` (text): Location text for second entry
    - `clock_out_2_location` (text): Location text for second exit
    - `original_record_type` (text): Original record type text from spreadsheet

  2. Purpose
    - Store location identifiers like "FO BH" when present in spreadsheet
    - Display these locations in the UI instead of showing blank
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'clock_in_1_location'
  ) THEN
    ALTER TABLE time_records ADD COLUMN clock_in_1_location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'clock_out_1_location'
  ) THEN
    ALTER TABLE time_records ADD COLUMN clock_out_1_location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'clock_in_2_location'
  ) THEN
    ALTER TABLE time_records ADD COLUMN clock_in_2_location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'clock_out_2_location'
  ) THEN
    ALTER TABLE time_records ADD COLUMN clock_out_2_location text;
  END IF;
END $$;
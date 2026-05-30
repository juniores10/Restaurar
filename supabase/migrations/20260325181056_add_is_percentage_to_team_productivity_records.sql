/*
  # Add is_percentage flag to team productivity records

  1. Modified Tables
    - `team_productivity_records`
      - Added `is_percentage` (boolean, default false) - When true, values for this subject are displayed as percentages in the table

  2. Notes
    - This allows users to mark specific subjects/rows as percentage values
    - Existing records default to false (no change in behavior)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_productivity_records' AND column_name = 'is_percentage'
  ) THEN
    ALTER TABLE team_productivity_records ADD COLUMN is_percentage boolean DEFAULT false;
  END IF;
END $$;

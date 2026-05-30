/*
  # Add Second Time Pair to Shift Times

  1. Changes to Existing Tables
    - `shift_times`
      - Add `start_time_2` (time, nullable) - Second entry time (e.g., return from lunch)
      - Add `end_time_2` (time, nullable) - Second exit time (e.g., end of workday)

  2. Notes
    - Allows shifts to have split schedules with two time periods
    - Common use case: morning entry, lunch break exit, lunch return, end of day exit
    - Fields are nullable as not all shifts require split schedules
    - Example: 08:00-12:00 and 13:00-17:00 for shifts with lunch break
*/

-- Add second time pair fields to shift_times table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_times' AND column_name = 'start_time_2'
  ) THEN
    ALTER TABLE shift_times ADD COLUMN start_time_2 time;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_times' AND column_name = 'end_time_2'
  ) THEN
    ALTER TABLE shift_times ADD COLUMN end_time_2 time;
  END IF;
END $$;

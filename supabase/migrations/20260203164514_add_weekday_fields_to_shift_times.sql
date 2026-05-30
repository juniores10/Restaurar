/*
  # Add Weekday Fields to Shift Times

  1. Changes to Existing Tables
    - `shift_times`
      - Add `works_sunday` (boolean, default false) - Indicates if shift works on Sundays
      - Add `works_monday` (boolean, default false) - Indicates if shift works on Mondays
      - Add `works_tuesday` (boolean, default false) - Indicates if shift works on Tuesdays
      - Add `works_wednesday` (boolean, default false) - Indicates if shift works on Wednesdays
      - Add `works_thursday` (boolean, default false) - Indicates if shift works on Thursdays
      - Add `works_friday` (boolean, default false) - Indicates if shift works on Fridays
      - Add `works_saturday` (boolean, default false) - Indicates if shift works on Saturdays

  2. Notes
    - Allows shift schedules to specify which days of the week they are active
    - Default is false for all days, requiring explicit configuration
    - Boolean fields provide simple checkbox interface for scheduling
*/

-- Add weekday fields to shift_times table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_times' AND column_name = 'works_sunday'
  ) THEN
    ALTER TABLE shift_times ADD COLUMN works_sunday boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_times' AND column_name = 'works_monday'
  ) THEN
    ALTER TABLE shift_times ADD COLUMN works_monday boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_times' AND column_name = 'works_tuesday'
  ) THEN
    ALTER TABLE shift_times ADD COLUMN works_tuesday boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_times' AND column_name = 'works_wednesday'
  ) THEN
    ALTER TABLE shift_times ADD COLUMN works_wednesday boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_times' AND column_name = 'works_thursday'
  ) THEN
    ALTER TABLE shift_times ADD COLUMN works_thursday boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_times' AND column_name = 'works_friday'
  ) THEN
    ALTER TABLE shift_times ADD COLUMN works_friday boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shift_times' AND column_name = 'works_saturday'
  ) THEN
    ALTER TABLE shift_times ADD COLUMN works_saturday boolean DEFAULT false;
  END IF;
END $$;

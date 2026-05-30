/*
  # Add extra hour columns to time_records

  1. Modified Tables
    - `time_records`
      - `interval_hours` (numeric, default 0) - H. Intervalo
      - `missing_hours` (numeric, default 0) - H. Faltantes
      - `normal_hours` (numeric, default 0) - Horas Normais
      - `overtime_1` (numeric, default 0) - H.E. 1 (0%)
      - `overtime_2` (numeric, default 0) - H.E. 2 (100%)

  2. Notes
    - These columns store values parsed from uploaded timesheet spreadsheets
    - All columns default to 0 and are nullable
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'interval_hours'
  ) THEN
    ALTER TABLE time_records ADD COLUMN interval_hours numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'missing_hours'
  ) THEN
    ALTER TABLE time_records ADD COLUMN missing_hours numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'normal_hours'
  ) THEN
    ALTER TABLE time_records ADD COLUMN normal_hours numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'overtime_1'
  ) THEN
    ALTER TABLE time_records ADD COLUMN overtime_1 numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'overtime_2'
  ) THEN
    ALTER TABLE time_records ADD COLUMN overtime_2 numeric DEFAULT 0;
  END IF;
END $$;
/*
  # Add Adicional Noturno and Horas Noturnas Reduzidas to time_records

  ## Changes
  - `time_records` table gets two new numeric columns:
    - `adicional_noturno` (numeric, default 0): Stores "A.N." (Adicional Noturno) hours from the Excel timesheet
    - `horas_noturnas_reduzidas` (numeric, default 0): Stores "H.N. Rod." (Horas Noturnas Reduzidas) hours from the Excel timesheet

  These fields appear in the PontoMais Excel export between the H.E. 2 (100%) column and the Horas Totais column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'adicional_noturno'
  ) THEN
    ALTER TABLE time_records ADD COLUMN adicional_noturno numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_records' AND column_name = 'horas_noturnas_reduzidas'
  ) THEN
    ALTER TABLE time_records ADD COLUMN horas_noturnas_reduzidas numeric DEFAULT 0;
  END IF;
END $$;

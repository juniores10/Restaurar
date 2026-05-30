/*
  # Add PIS field to employees table

  1. Changes
    - Add `pis` column to `employees` table (text, nullable)
    - PIS (Programa de Integração Social) is a Brazilian social integration program number
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'pis'
  ) THEN
    ALTER TABLE employees ADD COLUMN pis text;
  END IF;
END $$;

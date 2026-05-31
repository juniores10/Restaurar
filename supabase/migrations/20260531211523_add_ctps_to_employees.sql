/*
  # Add CTPS field to employees

  1. Modified Tables
    - `employees`
      - `ctps` (text, nullable) - Carteira de Trabalho e Previdência Social number

  2. Notes
    - Field is optional since not all employees may have CTPS documented
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'ctps'
  ) THEN
    ALTER TABLE employees ADD COLUMN ctps text;
  END IF;
END $$;
/*
  # Add missing employee contact fields

  1. Modified Tables
    - `employees`
      - `rg` (text) - Documento RG do colaborador
      - `rg_document_url` (text) - URL do documento RG digitalizado
      - `phone` (text) - Telefone principal
      - `address` (text) - Endereco completo
      - `is_active` (boolean) - Status ativo/inativo

  2. Notes
    - These columns are used in the employee form but were missing from the table
    - Using IF NOT EXISTS to prevent errors if columns already exist
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'rg'
  ) THEN
    ALTER TABLE employees ADD COLUMN rg text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'rg_document_url'
  ) THEN
    ALTER TABLE employees ADD COLUMN rg_document_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'phone'
  ) THEN
    ALTER TABLE employees ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'address'
  ) THEN
    ALTER TABLE employees ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE employees ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;
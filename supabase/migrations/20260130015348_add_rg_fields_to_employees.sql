/*
  # Adicionar campos RG aos colaboradores

  1. Alterações
    - Adiciona campo `rg` (text) para armazenar o número do RG
    - Adiciona campo `rg_document_url` (text) para armazenar o caminho do documento no storage
  
  2. Notas
    - Campos são opcionais (nullable)
    - Permite que o administrador anexe documentos de identificação
*/

-- Add RG fields to employees table
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
END $$;

-- Add comment for documentation
COMMENT ON COLUMN employees.rg IS 'Número do RG do colaborador';
COMMENT ON COLUMN employees.rg_document_url IS 'URL do documento RG/CPF no storage';
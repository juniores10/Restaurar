/*
  # Adicionar colunas faltantes na tabela employees

  ## Alteracoes
  1. Adiciona coluna `phone` - Telefone do funcionario
  2. Adiciona coluna `address` - Endereco do funcionario
  3. Adiciona coluna `rg` - RG do funcionario
  4. Adiciona coluna `rg_document_url` - URL do documento RG digitalizado
  5. Adiciona coluna `is_active` - Status ativo do funcionario

  ## Seguranca
  - Mantem RLS existente
  - Colunas sao opcionais (nullable)
*/

-- Adiciona coluna phone se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'phone'
  ) THEN
    ALTER TABLE employees ADD COLUMN phone text;
  END IF;
END $$;

-- Adiciona coluna address se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'address'
  ) THEN
    ALTER TABLE employees ADD COLUMN address text;
  END IF;
END $$;

-- Adiciona coluna rg se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'rg'
  ) THEN
    ALTER TABLE employees ADD COLUMN rg text;
  END IF;
END $$;

-- Adiciona coluna rg_document_url se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'rg_document_url'
  ) THEN
    ALTER TABLE employees ADD COLUMN rg_document_url text;
  END IF;
END $$;

-- Adiciona coluna is_active se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE employees ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;
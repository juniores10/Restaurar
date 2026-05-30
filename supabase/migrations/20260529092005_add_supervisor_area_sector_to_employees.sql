/*
  # Add supervisor, area, and sector fields to employees

  1. Modified Tables
    - `employees`
      - `supervisor_id` (uuid, FK to employees) - Superior Imediato
      - `area` (text) - Area: administrativa ou operacional
      - `sector_id` (uuid, FK to data_types) - Setor (separado de departamento)

  2. New Data Type
    - type=7 in `data_types` for Setores (separado de Departamento)

  3. Important Notes
    - Departamento (type=2) permanece como esta
    - Novo tipo 7 para Setores dentro dos departamentos
    - supervisor_id referencia outro colaborador da tabela employees
    - area aceita valores: 'ADMINISTRATIVO' ou 'OPERACIONAL'
*/

-- Add supervisor_id column to employees (references another employee)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'supervisor_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN supervisor_id uuid REFERENCES employees(id);
  END IF;
END $$;

-- Add area column to employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'area'
  ) THEN
    ALTER TABLE employees ADD COLUMN area text;
  END IF;
END $$;

-- Add sector_id column to employees (references data_types with type=7)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'sector_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN sector_id uuid REFERENCES data_types(id);
  END IF;
END $$;

-- Create index on supervisor_id for performance
CREATE INDEX IF NOT EXISTS idx_employees_supervisor_id ON employees(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_employees_sector_id ON employees(sector_id);
CREATE INDEX IF NOT EXISTS idx_employees_area ON employees(area);

-- Insert sectors (type=7) based on the spreadsheet data
INSERT INTO data_types (description, type, status)
SELECT s.description, 7, 1
FROM (VALUES
  ('VENDAS'),
  ('CUSTOMER SUCCESS'),
  ('ALMOXARIFADO'),
  ('PCP'),
  ('CORTE'),
  ('COSTURA'),
  ('DOBRA'),
  ('EMBALAGEM ESTERIL'),
  ('EMBALAGEM NAO ESTERIL'),
  ('ENGENHARIA'),
  ('JOVEM APRENDIZ'),
  ('PACOTE'),
  ('EXPEDIÇÃO'),
  ('OBRA'),
  ('LOGISTICA'),
  ('FINANCEIRO'),
  ('MARKETING'),
  ('RH'),
  ('SERVICOS GERAIS'),
  ('TI'),
  ('MANUTENCAO'),
  ('COMERCIAL'),
  ('COMPRAS')
) AS s(description)
WHERE NOT EXISTS (
  SELECT 1 FROM data_types WHERE data_types.description = s.description AND data_types.type = 7
);

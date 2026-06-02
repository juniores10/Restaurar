-- Supplier Data Import Generated SQL
-- Generated: 2026-06-02T21:01:54.277Z
-- Total Records: 10
-- 
-- This script:
-- 1. Creates a temporary table for CSV data
-- 2. Updates existing suppliers with CNPJ (matching by location + name)
-- 3. Inserts new suppliers that don't already exist

-- Step 1: Create temporary table for CSV data
CREATE TEMP TABLE csv_suppliers (
  cnpj text,
  name text,
  city text,
  state text,
  zip_code text,
  source_row integer
);

-- Step 2: Insert CSV data into temporary table
INSERT INTO csv_suppliers VALUES ('118.125.557-09', 'ISABELA CRISTINA DUQUE DE OLIVEIRA', 'Alagoinhas', 'BA', '48023-690', 1);
INSERT INTO csv_suppliers VALUES ('123.456.789-01', 'COMPANY ABC LTDA', 'São Paulo', 'SP', '01310-100', 2);
INSERT INTO csv_suppliers VALUES ('987.654.321-00', 'MEDICAL SUPPLIES CORP', 'Rio de Janeiro', 'RJ', '20000-000', 3);
INSERT INTO csv_suppliers VALUES ('234.567.890-12', 'SUPPLIES & MORE LTDA', 'Belo Horizonte', 'MG', '30140-071', 4);
INSERT INTO csv_suppliers VALUES ('345.678.901-23', 'HEALTHCARE DISTRIBUTION CENTER', 'Brasília', 'DF', '70000-000', 5);
INSERT INTO csv_suppliers VALUES ('456.789.012-34', 'PHARMA BRASIL COMERCIO', 'Curitiba', 'PR', '80000-000', 6);
INSERT INTO csv_suppliers VALUES ('567.890.123-45', 'MEDICAL SOLUTIONS LLC', 'Salvador', 'BA', '40000-000', 7);
INSERT INTO csv_suppliers VALUES ('678.901.234-56', 'SEROMED COMERCIO LTDA', 'Porto Alegre', 'RS', '90000-000', 8);
INSERT INTO csv_suppliers VALUES ('789.012.345-67', 'UNIFARMA DISTRIBUIDORA', 'Fortaleza', 'CE', '60000-000', 9);
INSERT INTO csv_suppliers VALUES ('890.123.456-78', 'MEDICARE SOLUTIONS', 'Manaus', 'AM', '69000-000', 10);

-- Inserted 10 records into temporary table

-- Step 3: Update existing suppliers with CNPJ
-- Matches on: city + state + name similarity (exact or LIKE)
UPDATE suppliers s
SET cnpj = c.cnpj, updated_at = now()
FROM csv_suppliers c
WHERE s.cnpj IS NULL
AND c.cnpj IS NOT NULL AND c.cnpj != ''
AND s.city = c.city
AND s.state = c.state
AND (
  LOWER(s.name) = LOWER(c.name)
  OR LOWER(s.name) LIKE LOWER('%' || SUBSTRING(c.name FROM 1 FOR 25) || '%')
  OR LOWER(s.trade_name) LIKE LOWER('%' || SUBSTRING(c.name FROM 1 FOR 25) || '%')
);

-- Step 4: Insert new suppliers that don't match any existing
INSERT INTO suppliers (name, cnpj, city, state, zip_code, status, created_at, updated_at)
SELECT
  c.name,
  NULLIF(c.cnpj, '') as cnpj,
  c.city,
  c.state,
  NULLIF(c.zip_code, '') as zip_code,
  0 as status,
  now() as created_at,
  now() as updated_at
FROM csv_suppliers c
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers s
  WHERE (
    (c.cnpj IS NOT NULL AND c.cnpj != '' AND s.cnpj = c.cnpj)
    OR (LOWER(s.name) = LOWER(c.name) AND s.city = c.city AND s.state = c.state)
    OR (s.trade_name IS NOT NULL AND LOWER(s.trade_name) = LOWER(c.name) AND s.city = c.city AND s.state = c.state)
  )
);

-- Step 5: Cleanup
DROP TABLE csv_suppliers;

-- Summary and verification:
-- Total CSV records processed: 10
-- 
-- After running this script, check results with:
-- SELECT COUNT(*) as total_suppliers FROM suppliers;
-- SELECT COUNT(*) as suppliers_with_cnpj FROM suppliers WHERE cnpj IS NOT NULL;
-- SELECT COUNT(*) as suppliers_without_cnpj FROM suppliers WHERE cnpj IS NULL;
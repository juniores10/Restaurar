# Supplier Data Import Tool Documentation

## Overview

This tool processes CSV supplier data and generates optimized SQL statements to populate the `suppliers` table in the database. It handles two main operations:

1. **Update existing suppliers** with CNPJ information based on location and name matching
2. **Insert new suppliers** that don't exist in the database

## Files

### Main Script: `gen_suppliers_sql.js`

A Node.js script (ES module) that:
- Reads supplier CSV data
- Parses multiple CSV formats (comma or semicolon-delimited)
- Normalizes field names with accent-aware matching
- Generates optimized SQL with proper escaping
- Outputs SQL to `suppliers_import.sql`

### Input: CSV Format

Expected columns (case and accent-insensitive):
- `CNPJ` - Company tax ID (or CPF for individuals)
- `CLIENTE` (or NOME, NAME, RAZAO SOCIAL) - Company name
- `MUNICÍPIO` (or CIDADE, CITY) - City name
- `UF` (or STATE, ESTADO) - Brazilian state code
- `CEP` (or ZIP) - Postal code

Example:
```csv
CNPJ,CLIENTE,MUNICÍPIO,UF,CEP
118.125.557-09,ISABELA CRISTINA DUQUE DE OLIVEIRA,Alagoinhas,BA,48023-690
123.456.789-01,COMPANY ABC LTDA,São Paulo,SP,01310-100
```

### Output: `suppliers_import.sql`

Generated SQL file containing:
1. Temporary table creation
2. CSV data insertion (with proper SQL escaping)
3. UPDATE statement for existing suppliers
4. INSERT statement for new suppliers
5. Cleanup and verification queries

## Usage

### Basic Usage (with no CSV provided)

```bash
node gen_suppliers_sql.js
```

Creates sample SQL with 3 example records.

### With Custom CSV File

```bash
node gen_suppliers_sql.js /path/to/suppliers.csv
```

Automatically detects and reads the CSV file.

### Auto-detection

The script searches for supplier CSV files in these locations:
- `./suppliers.csv`
- `./public/suppliers.csv`
- `./fornecedores.csv`
- `./public/fornecedores.csv`

## SQL Matching Strategy

### Update Logic

Matches existing suppliers (with null CNPJ) using:

1. **Exact match**: `LOWER(supplier.name) = LOWER(csv.name)`
2. **Partial match**: Using LIKE with first 25 characters
3. **Trade name match**: Checking against `trade_name` field
4. **Location match**: Both city and state must match exactly

```sql
WHERE s.cnpj IS NULL
  AND s.city = c.city
  AND s.state = c.state
  AND (
    LOWER(s.name) = LOWER(c.name)
    OR LOWER(s.name) LIKE LOWER('%' || SUBSTRING(c.name FROM 1 FOR 25) || '%')
    OR LOWER(s.trade_name) LIKE LOWER('%' || SUBSTRING(c.name FROM 1 FOR 25) || '%')
  )
```

### Insert Logic

Inserts new suppliers that don't match any existing record by:

1. **CNPJ match**: If CNPJ exists and matches an existing supplier
2. **Exact name match**: Name, city, and state all match exactly
3. **Trade name match**: Trade name, city, and state all match

This prevents duplicates while allowing new suppliers to be added.

## Features

- **Accent-aware matching**: Properly handles Portuguese accents (á, é, í, ó, ú, ã, õ, ç)
- **SQL injection prevention**: All values are properly escaped
- **Flexible field naming**: Recognizes common variations (CIDADE/MUNICIPIO, NOME/CLIENTE, etc.)
- **Multiple CSV formats**: Handles both comma and semicolon delimiters
- **Quoted value handling**: Properly parses CSV values with embedded commas
- **Empty value handling**: Converts empty strings to NULL in database
- **Error reporting**: Shows warnings for incomplete records
- **Idempotent operations**: Can be run multiple times safely

## Database Target

Table: `suppliers`

Columns populated:
- `name` - Company name (required)
- `cnpj` - Tax ID or CPF
- `city` - Municipality name
- `state` - State code (2 letters)
- `zip_code` - Postal code
- `status` - Set to 0 (active) for new suppliers
- `created_at` - Current timestamp
- `updated_at` - Current timestamp

## Example Execution

```bash
$ node gen_suppliers_sql.js test_suppliers.csv

Reading CSV from: test_suppliers.csv
Parsed 10 records from CSV
Generating SQL statements...

SQL file generated successfully: suppliers_import.sql
File size: 3.17 KB
Records to process: 10

First 40 lines of generated SQL:
-----------------------------------
-- Supplier Data Import Generated SQL
-- Generated: 2026-06-02T21:01:54.277Z
-- Total Records: 10
...
```

## Verification Queries

After running the generated SQL, use these queries to verify:

```sql
-- Check total count
SELECT COUNT(*) as total_suppliers FROM suppliers;

-- Count suppliers with CNPJ
SELECT COUNT(*) as suppliers_with_cnpj FROM suppliers WHERE cnpj IS NOT NULL;

-- Count suppliers without CNPJ
SELECT COUNT(*) as suppliers_without_cnpj FROM suppliers WHERE cnpj IS NULL;

-- Check for duplicates
SELECT name, city, state, COUNT(*) 
FROM suppliers 
GROUP BY name, city, state 
HAVING COUNT(*) > 1;
```

## Error Handling

The script will:
- Skip rows missing required fields (name, city, state)
- Warn about incomplete records with row numbers
- Continue processing remaining records
- Generate SQL even if some records are incomplete

## Implementation Notes

- Uses temporary table to ensure atomicity
- All operations in a single transaction (wrap with BEGIN/COMMIT if needed)
- Proper NULLIF() handling for empty strings
- Case-insensitive matching for robustness
- Indexes on name and CNPJ for query performance

## Future Enhancements

Possible improvements:
- Support for phone number and email from CSV
- Deduplication within CSV file
- Conflict detection and reporting
- Batch size optimization for large datasets
- Export to other formats (JSON, XML)

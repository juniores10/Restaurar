#!/usr/bin/env node

/**
 * Supplier Import SQL Generator
 *
 * This script reads supplier CSV data and generates SQL statements to:
 * 1. Update existing suppliers with CNPJ (matching by city+state+name similarity)
 * 2. Insert new suppliers that don't exist in the database
 *
 * CSV Format: CNPJ,CLIENTE,MUNICÍPIO,UF,CEP
 *
 * Usage:
 *   node gen_suppliers_sql.js [input-csv-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse CSV string to array of objects
 * Handles comma-separated and semicolon-separated formats
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Detect delimiter (comma or semicolon)
  let delimiter = ',';
  if (lines[0].includes(';') && !lines[0].includes(',')) {
    delimiter = ';';
  }

  const headerLine = lines[0];
  let headers = headerLine.split(delimiter).map(h => h.trim());

  // Normalize header names
  headers = headers.map(h => {
    const normalized = h.toUpperCase()
      .replace(/^\s+|\s+$/g, '')
      .replace(/Á|À|Ã/g, 'A')
      .replace(/É|È|Ê/g, 'E')
      .replace(/Í|Ì|Î/g, 'I')
      .replace(/Ó|Ò|Ô|Õ/g, 'O')
      .replace(/Ú|Ù|Û/g, 'U')
      .replace(/Ç/g, 'C');
    return normalized;
  });

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i], delimiter);

    if (values.length >= Math.min(headers.length, 5)) {
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });
      records.push(record);
    }
  }

  return records;
}

/**
 * Parse a CSV line handling quoted values with delimiters
 */
function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Escape single quotes for SQL
 */
function escapeSql(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

/**
 * Remove accents from string for matching
 */
function removeAccents(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize field names from CSV
 */
function normalizeHeaders(record) {
  const normalized = {};

  for (const [key, value] of Object.entries(record)) {
    const upperKey = removeAccents(String(key)).toUpperCase();

    if (upperKey.includes('CNPJ') || upperKey.includes('CPF')) {
      normalized.cnpj = value;
    } else if (upperKey.includes('CLIENTE') || upperKey.includes('NOME') || upperKey.includes('NAME') || upperKey.includes('RAZAO') || upperKey.includes('RAZSOCIAL')) {
      normalized.name = value;
    } else if (upperKey.includes('MUNICIP') || upperKey.includes('CIDADE') || upperKey.includes('CITY')) {
      normalized.city = value;
    } else if (upperKey === 'UF' || upperKey.includes('STATE') || upperKey.includes('ESTADO')) {
      normalized.state = value;
    } else if (upperKey.includes('CEP') || upperKey.includes('ZIP')) {
      normalized.zip_code = value;
    }
  }

  return normalized;
}

/**
 * Generate SQL for updates and inserts
 */
function generateSQL(records) {
  const sqlStatements = [];

  sqlStatements.push('-- Supplier Data Import Generated SQL');
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
  sqlStatements.push(`-- Total Records: ${records.length}`);
  sqlStatements.push('-- ');
  sqlStatements.push('-- This script:');
  sqlStatements.push('-- 1. Creates a temporary table for CSV data');
  sqlStatements.push('-- 2. Updates existing suppliers with CNPJ (matching by location + name)');
  sqlStatements.push('-- 3. Inserts new suppliers that don\'t already exist');
  sqlStatements.push('');

  // Create temporary table
  sqlStatements.push('-- Step 1: Create temporary table for CSV data');
  sqlStatements.push('CREATE TEMP TABLE csv_suppliers (');
  sqlStatements.push('  cnpj text,');
  sqlStatements.push('  name text,');
  sqlStatements.push('  city text,');
  sqlStatements.push('  state text,');
  sqlStatements.push('  zip_code text,');
  sqlStatements.push('  source_row integer');
  sqlStatements.push(');');
  sqlStatements.push('');

  // Insert CSV data into temp table
  sqlStatements.push('-- Step 2: Insert CSV data into temporary table');
  let insertCount = 0;
  records.forEach((record, idx) => {
    const normalized = normalizeHeaders(record);

    const cnpj = escapeSql(normalized.cnpj || '');
    const name = escapeSql(normalized.name || '');
    const city = escapeSql(normalized.city || '');
    const state = escapeSql(normalized.state || '');
    const zipCode = escapeSql(normalized.zip_code || '');

    if (!name || !city || !state) {
      console.warn(`Warning: Skipping row ${idx + 1} - Missing required fields (name, city, state)`);
      return;
    }

    sqlStatements.push(
      `INSERT INTO csv_suppliers VALUES ('${cnpj}', '${name}', '${city}', '${state}', '${zipCode}', ${idx + 1});`
    );
    insertCount++;
  });
  sqlStatements.push('');
  sqlStatements.push(`-- Inserted ${insertCount} records into temporary table`);
  sqlStatements.push('');

  // Update existing suppliers
  sqlStatements.push('-- Step 3: Update existing suppliers with CNPJ');
  sqlStatements.push('-- Matches on: city + state + name similarity (exact or LIKE)');
  sqlStatements.push('UPDATE suppliers s');
  sqlStatements.push('SET cnpj = c.cnpj, updated_at = now()');
  sqlStatements.push('FROM csv_suppliers c');
  sqlStatements.push('WHERE s.cnpj IS NULL');
  sqlStatements.push('AND c.cnpj IS NOT NULL AND c.cnpj != \'\'');
  sqlStatements.push('AND s.city = c.city');
  sqlStatements.push('AND s.state = c.state');
  sqlStatements.push('AND (');
  sqlStatements.push('  LOWER(s.name) = LOWER(c.name)');
  sqlStatements.push('  OR LOWER(s.name) LIKE LOWER(\'%\' || SUBSTRING(c.name FROM 1 FOR 25) || \'%\')');
  sqlStatements.push('  OR LOWER(s.trade_name) LIKE LOWER(\'%\' || SUBSTRING(c.name FROM 1 FOR 25) || \'%\')');
  sqlStatements.push(');');
  sqlStatements.push('');

  // Insert new suppliers
  sqlStatements.push('-- Step 4: Insert new suppliers that don\'t match any existing');
  sqlStatements.push('INSERT INTO suppliers (name, cnpj, city, state, zip_code, status, created_at, updated_at)');
  sqlStatements.push('SELECT');
  sqlStatements.push('  c.name,');
  sqlStatements.push('  NULLIF(c.cnpj, \'\') as cnpj,');
  sqlStatements.push('  c.city,');
  sqlStatements.push('  c.state,');
  sqlStatements.push('  NULLIF(c.zip_code, \'\') as zip_code,');
  sqlStatements.push('  0 as status,');
  sqlStatements.push('  now() as created_at,');
  sqlStatements.push('  now() as updated_at');
  sqlStatements.push('FROM csv_suppliers c');
  sqlStatements.push('WHERE NOT EXISTS (');
  sqlStatements.push('  SELECT 1 FROM suppliers s');
  sqlStatements.push('  WHERE (');
  sqlStatements.push('    (c.cnpj IS NOT NULL AND c.cnpj != \'\' AND s.cnpj = c.cnpj)');
  sqlStatements.push('    OR (LOWER(s.name) = LOWER(c.name) AND s.city = c.city AND s.state = c.state)');
  sqlStatements.push('    OR (s.trade_name IS NOT NULL AND LOWER(s.trade_name) = LOWER(c.name) AND s.city = c.city AND s.state = c.state)');
  sqlStatements.push('  )');
  sqlStatements.push(');');
  sqlStatements.push('');

  // Summary report
  sqlStatements.push('-- Step 5: Cleanup');
  sqlStatements.push('DROP TABLE csv_suppliers;');
  sqlStatements.push('');

  // Optional: Report on updated/inserted counts
  sqlStatements.push('-- Summary and verification:');
  sqlStatements.push(`-- Total CSV records processed: ${insertCount}`);
  sqlStatements.push('-- ');
  sqlStatements.push('-- After running this script, check results with:');
  sqlStatements.push('-- SELECT COUNT(*) as total_suppliers FROM suppliers;');
  sqlStatements.push('-- SELECT COUNT(*) as suppliers_with_cnpj FROM suppliers WHERE cnpj IS NOT NULL;');
  sqlStatements.push('-- SELECT COUNT(*) as suppliers_without_cnpj FROM suppliers WHERE cnpj IS NULL;');

  return sqlStatements.join('\n');
}

/**
 * Main function
 */
function main() {
  const projectDir = '/tmp/cc-agent/67362188/project';
  const outputPath = path.join(projectDir, 'suppliers_import.sql');

  let inputPath = process.argv[2];

  // If no argument, try to find a suppliers CSV file
  if (!inputPath) {
    const possiblePaths = [
      path.join(projectDir, 'suppliers.csv'),
      path.join(projectDir, 'public', 'suppliers.csv'),
      path.join(projectDir, 'fornecedores.csv'),
      path.join(projectDir, 'public', 'fornecedores.csv'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        inputPath = p;
        break;
      }
    }
  }

  try {
    let records = [];

    if (inputPath && fs.existsSync(inputPath)) {
      console.log(`Reading CSV from: ${inputPath}`);
      const csvContent = fs.readFileSync(inputPath, 'utf-8');
      records = parseCSV(csvContent);
      console.log(`Parsed ${records.length} records from CSV`);
    } else {
      console.log('No supplier CSV file found.');
      console.log('Creating template with sample data...');

      // Sample data template
      const sampleRecords = [
        ['118.125.557-09', 'ISABELA CRISTINA DUQUE DE OLIVEIRA', 'Alagoinhas', 'BA', '48023-690'],
        ['123.456.789-01', 'COMPANY ABC LTDA', 'São Paulo', 'SP', '01310-100'],
        ['987.654.321-00', 'MEDICAL SUPPLIES CORP', 'Rio de Janeiro', 'RJ', '20000-000']
      ];

      // Convert to objects with proper headers
      const headers = ['CNPJ', 'CLIENTE', 'MUNICÍPIO', 'UF', 'CEP'];
      records = sampleRecords.map(row => {
        const obj = {};
        headers.forEach((header, idx) => {
          obj[header] = row[idx] || '';
        });
        return obj;
      });
    }

    if (records.length === 0) {
      console.error('No records to process. Please provide a CSV file with data.');
      process.exit(1);
    }

    // Generate SQL
    console.log('Generating SQL statements...');
    const sql = generateSQL(records);

    // Write output
    fs.writeFileSync(outputPath, sql, 'utf-8');
    console.log(`\nSQL file generated successfully: ${outputPath}`);
    console.log(`File size: ${(sql.length / 1024).toFixed(2)} KB`);
    console.log(`Records to process: ${records.length}`);

    // Show sample of generated SQL
    const lines = sql.split('\n');
    console.log('\nFirst 40 lines of generated SQL:');
    console.log('-----------------------------------');
    lines.slice(0, 40).forEach(line => console.log(line));
    if (lines.length > 40) {
      console.log('...');
      console.log(`... (${lines.length - 40} more lines)`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

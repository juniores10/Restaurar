/*
  # Add signed file URL to payroll document assignments

  1. Changes
    - Add `signed_file_url` column to `payroll_document_assignments` table
    - This stores the signed PDF file path for each individual employee
    - Allows each employee to have their own signed version without affecting others
    
  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE payroll_document_assignments
ADD COLUMN IF NOT EXISTS signed_file_url text;

COMMENT ON COLUMN payroll_document_assignments.signed_file_url IS 'Path to the signed PDF file in storage for this specific employee';

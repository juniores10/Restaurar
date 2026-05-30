/*
  # Add section type and subject fields to productivity records

  1. Changes
    - Add `section_type` column to identify record source (ATENDIMENTOS or IXC)
    - Add `subject` column for IXC records which have categorized data
    
  2. Notes
    - section_type will store values like 'ATENDIMENTOS_OPA' or 'IXC'
    - subject stores the "Assunto" value from IXC section
    - Existing records will default to 'ATENDIMENTOS_OPA'
*/

ALTER TABLE sector_productivity_records
ADD COLUMN IF NOT EXISTS section_type text DEFAULT 'ATENDIMENTOS_OPA';

ALTER TABLE sector_productivity_records
ADD COLUMN IF NOT EXISTS subject text;

CREATE INDEX IF NOT EXISTS idx_productivity_records_section_type 
ON sector_productivity_records(upload_id, section_type);
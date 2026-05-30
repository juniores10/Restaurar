/*
  # Add original_record_type column to time_records

  1. Changes
    - Adds `original_record_type` column to store the raw record type from uploaded files
    - This preserves the original value before normalization

  2. Notes
    - Column is nullable since existing records won't have this value
*/

ALTER TABLE time_records
ADD COLUMN IF NOT EXISTS original_record_type text;
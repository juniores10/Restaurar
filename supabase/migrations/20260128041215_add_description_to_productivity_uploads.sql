/*
  # Add description field to productivity uploads

  1. Changes
    - Add `description` column to sector_productivity_uploads to allow multiple periods for same sector/month
    - This enables creating multiple productivity entries for the same sector and month with different descriptions
    
  2. Notes
    - Allows users to differentiate between multiple productivity periods
    - Example: "Financeiro - Equipe A", "Financeiro - Equipe B"
*/

ALTER TABLE sector_productivity_uploads
ADD COLUMN IF NOT EXISTS description text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_productivity_uploads_description 
ON sector_productivity_uploads(sector_id, reference_month, description);

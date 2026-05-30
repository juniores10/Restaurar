/*
  # Add Status Column to Sector Productivity Uploads

  1. Changes
    - Add `status` column to `sector_productivity_uploads` table
      - Values: 'pending', 'processing', 'completed', 'failed'
      - Default: 'completed' (for backwards compatibility with existing records)
  
  2. Notes
    - Column is added with a default value to handle existing records
    - Status helps track the upload processing lifecycle
*/

-- Add status column to sector_productivity_uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sector_productivity_uploads' AND column_name = 'status'
  ) THEN
    ALTER TABLE sector_productivity_uploads 
    ADD COLUMN status text DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;

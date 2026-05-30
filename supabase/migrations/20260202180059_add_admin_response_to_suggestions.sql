/*
  # Add admin_response field to suggestions table

  1. Changes
    - Add `admin_response` column to `suggestions` table
      - Type: text (nullable)
      - Purpose: Store administrator's response to employee suggestions
  
  2. Notes
    - This field is optional and will be populated by administrators
    - Employees can view this field to see responses to their suggestions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suggestions' AND column_name = 'admin_response'
  ) THEN
    ALTER TABLE suggestions ADD COLUMN admin_response text;
  END IF;
END $$;
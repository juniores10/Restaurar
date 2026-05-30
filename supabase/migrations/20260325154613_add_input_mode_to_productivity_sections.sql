/*
  # Add input_mode to productivity_sections

  ## Summary
  Adds an `input_mode` column to `productivity_sections` to allow each section (table)
  to define whether values entered by collaborators are normal numbers or percentages.

  ## Changes
  - `productivity_sections`
    - New column `input_mode` (text, default 'number')
      - 'number' = normal numeric input (e.g., 10, 25.5)
      - 'percentage' = percentage input (e.g., 85%, shown with % symbol)

  ## Notes
  - Default is 'number' so existing sections are not affected
  - The frontend will use this field to format display and data entry accordingly
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productivity_sections' AND column_name = 'input_mode'
  ) THEN
    ALTER TABLE productivity_sections ADD COLUMN input_mode text NOT NULL DEFAULT 'number';
  END IF;
END $$;

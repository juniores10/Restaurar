/*
  # Add unique constraint to prevent duplicate data types

  1. Changes
    - Add unique constraint on (description, type) in data_types table
    - This prevents duplicate departments, positions, functions, etc. with the same name
  
  2. Security
    - No changes to RLS policies
*/

-- Add unique constraint to prevent duplicates within the same type
CREATE UNIQUE INDEX IF NOT EXISTS unique_data_type_description_per_type 
ON data_types (LOWER(TRIM(description)), type);

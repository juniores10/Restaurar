/*
  # Create parse diagnostics table
  
  1. New Tables
    - `parse_diagnostics`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `diagnostic_data` (jsonb) - stores raw parse output for debugging
  
  2. Security
    - Enable RLS
    - Allow authenticated users to insert and read
*/

CREATE TABLE IF NOT EXISTS parse_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  diagnostic_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE parse_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert diagnostics"
  ON parse_diagnostics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read diagnostics"
  ON parse_diagnostics FOR SELECT
  TO authenticated
  USING (true);

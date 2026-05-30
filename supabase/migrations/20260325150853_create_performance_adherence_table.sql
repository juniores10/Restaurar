/*
  # Create Performance Adherence Table

  ## Summary
  Creates a configuration table for performance adherence color thresholds.
  Defines color bands (green/yellow/red) based on adherence percentage.

  ## New Tables
  - `performance_adherence`
    - `id` (uuid, primary key)
    - `name` (text) - Profile name
    - `green_min` (numeric) - Minimum % for green band (default 80)
    - `yellow_min` (numeric) - Minimum % for yellow band (default 75)
    - `yellow_max` (numeric) - Maximum % for yellow band (default 79.9)
    - `is_active` (boolean) - Whether this profile is active
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Color Logic
  - Green: adherence >= green_min (>=80%)
  - Yellow: yellow_min <= adherence <= yellow_max (75% to 79.9%)
  - Red: adherence < yellow_min (<75%)

  ## Security
  - RLS enabled
  - Authenticated users can read, insert, update, delete
*/

CREATE TABLE IF NOT EXISTS performance_adherence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  green_min numeric(5,2) NOT NULL DEFAULT 80.00,
  yellow_min numeric(5,2) NOT NULL DEFAULT 75.00,
  yellow_max numeric(5,2) NOT NULL DEFAULT 79.90,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE performance_adherence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read performance adherence"
  ON performance_adherence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert performance adherence"
  ON performance_adherence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update performance adherence"
  ON performance_adherence FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete performance adherence"
  ON performance_adherence FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

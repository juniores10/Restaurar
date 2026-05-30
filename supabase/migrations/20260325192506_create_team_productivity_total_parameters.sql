/*
  # Create consolidated/total productivity parameters table

  1. New Tables
    - `team_productivity_total_parameters`
      - `id` (uuid, primary key)
      - `reference_month` (text, not null) - format YYYY-MM
      - `meta_diaria` (numeric, default 0) - daily target percentage
      - `oee` (numeric, default 0) - overall equipment effectiveness
      - `capacidade_dia` (numeric, default 0) - daily capacity in units
      - `meta_mensal_volume` (numeric, default 0) - monthly target volume
      - `dias_uteis_mensal` (integer, default 0) - working days in month
      - `meta_diaria_volume` (numeric, default 0) - daily target volume
      - `ritmo_atual_volume` (numeric, default 0) - current pace volume
      - `ritmo_atual_porcentagem` (numeric, default 0) - current pace percentage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid)

  2. Security
    - Enable RLS
    - Authenticated users can read, insert, update, and delete
*/

CREATE TABLE IF NOT EXISTS team_productivity_total_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_month text NOT NULL,
  meta_diaria numeric DEFAULT 0,
  oee numeric DEFAULT 0,
  capacidade_dia numeric DEFAULT 0,
  meta_mensal_volume numeric DEFAULT 0,
  dias_uteis_mensal integer DEFAULT 0,
  meta_diaria_volume numeric DEFAULT 0,
  ritmo_atual_volume numeric DEFAULT 0,
  ritmo_atual_porcentagem numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(reference_month)
);

ALTER TABLE team_productivity_total_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read total parameters"
  ON team_productivity_total_parameters FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert total parameters"
  ON team_productivity_total_parameters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update total parameters"
  ON team_productivity_total_parameters FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete total parameters"
  ON team_productivity_total_parameters FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

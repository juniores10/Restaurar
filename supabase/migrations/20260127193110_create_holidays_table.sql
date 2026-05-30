/*
  # Create Holidays Table

  1. New Tables
    - `holidays` - Store national and custom holidays
      - `id` (uuid, primary key)
      - `name` (text) - Holiday name
      - `date` (date) - Holiday date
      - `type` (integer) - 0=national, 1=custom/manual
      - `status` (integer) - 0=active, 1=inactive
      - `created_by` (uuid) - Creator
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  type integer DEFAULT 1,
  status integer DEFAULT 0,
  created_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date)
);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view holidays"
  ON holidays FOR SELECT
  TO authenticated
  USING (status = 0);

CREATE POLICY "Admins can insert holidays"
  ON holidays FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can update holidays"
  ON holidays FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins can delete holidays"
  ON holidays FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

INSERT INTO holidays (name, date, type) VALUES
  ('Confraternizacao Universal', '2026-01-01', 0),
  ('Carnaval', '2026-02-16', 0),
  ('Carnaval', '2026-02-17', 0),
  ('Quarta-feira de Cinzas', '2026-02-18', 0),
  ('Sexta-feira Santa', '2026-04-03', 0),
  ('Tiradentes', '2026-04-21', 0),
  ('Dia do Trabalho', '2026-05-01', 0),
  ('Corpus Christi', '2026-06-04', 0),
  ('Independencia do Brasil', '2026-09-07', 0),
  ('Nossa Senhora Aparecida', '2026-10-12', 0),
  ('Finados', '2026-11-02', 0),
  ('Proclamacao da Republica', '2026-11-15', 0),
  ('Natal', '2026-12-25', 0)
ON CONFLICT (date) DO NOTHING;

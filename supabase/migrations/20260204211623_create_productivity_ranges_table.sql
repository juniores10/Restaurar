/*
  # Create productivity ranges configuration table

  1. New Tables
    - `productivity_ranges`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the range (e.g., "Critico", "Atencao")
      - `color` (text) - Color identifier (e.g., "red", "orange", "green", "blue")
      - `min_percentage` (numeric) - Minimum percentage for this range
      - `max_percentage` (numeric, nullable) - Maximum percentage for this range (null means no upper limit)
      - `display_order` (integer) - Order to display the ranges
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `productivity_ranges` table
    - Add policies for authenticated users to read
    - Add policies for admin users to update

  3. Initial Data
    - Insert default productivity ranges
*/

CREATE TABLE IF NOT EXISTS productivity_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  min_percentage numeric NOT NULL,
  max_percentage numeric,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE productivity_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read productivity ranges"
  ON productivity_ranges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can update productivity ranges"
  ON productivity_ranges
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'admin'
    )
  );

INSERT INTO productivity_ranges (name, color, min_percentage, max_percentage, display_order) VALUES
  ('Critico', 'red', 0, 69, 1),
  ('Atencao', 'orange', 70, 89, 2),
  ('Meta Atingida', 'green', 90, 109, 3),
  ('Destaque', 'blue', 110, NULL, 4)
ON CONFLICT DO NOTHING;

/*
  # Create Expedition Records System

  1. New Tables
    - `expedition_records`
      - `id` (uuid, primary key)
      - `order_code` (text) - Codigo do Pedido (e.g., PD 42442)
      - `boxes` (integer) - Caixas (quantity of boxes)
      - `order_date` (date) - Data do Pedido
      - `reserved_by` (text) - Reservado Por
      - `delivery_date` (date) - Data de Entrega
      - `company_name` (text) - Razao Social
      - `trade_name` (text) - Nome fantasia
      - `city` (text) - Cidade destino
      - `state` (text) - UF
      - `shipped_date` (date) - Expedido Em
      - `shipped_by` (text) - Expedido Por (operador)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on expedition_records
    - Authenticated users can read all records
    - Admin users can insert, update, delete

  3. Notes
    - This table stores shipping/expedition records from the Expedition sector
    - Used for KPIs, dashboards, and performance tracking
*/

CREATE TABLE IF NOT EXISTS expedition_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL,
  boxes integer NOT NULL DEFAULT 0,
  order_date date,
  reserved_by text,
  delivery_date date,
  company_name text,
  trade_name text,
  city text,
  state text,
  shipped_date date,
  shipped_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expedition_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read expedition records"
  ON expedition_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can insert expedition records"
  ON expedition_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 5)
    )
  );

CREATE POLICY "Admin users can update expedition records"
  ON expedition_records
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 5)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 5)
    )
  );

CREATE POLICY "Admin users can delete expedition records"
  ON expedition_records
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 5)
    )
  );

CREATE INDEX IF NOT EXISTS idx_expedition_records_order_code ON expedition_records(order_code);
CREATE INDEX IF NOT EXISTS idx_expedition_records_shipped_date ON expedition_records(shipped_date);
CREATE INDEX IF NOT EXISTS idx_expedition_records_shipped_by ON expedition_records(shipped_by);
CREATE INDEX IF NOT EXISTS idx_expedition_records_state ON expedition_records(state);

/*
  # Create Freight Records System

  1. New Tables
    - `freight_carriers` - Transportadoras
      - `id` (uuid, primary key)
      - `name` (text, unique) - Nome da transportadora
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
    - `freight_records` - Registros de frete
      - `id` (uuid, primary key)
      - `shipment_date` (date) - Data do envio
      - `nf_number` (text) - Numero da nota fiscal
      - `nature` (text) - Natureza da operacao
      - `client_cnpj` (text) - CNPJ do cliente
      - `client_name` (text) - Nome do cliente
      - `destination_city` (text) - Cidade destino
      - `destination_state` (text) - UF destino
      - `destination_cep` (text) - CEP destino
      - `volume` (numeric) - Quantidade de volumes
      - `weight` (numeric) - Peso bruto
      - `nf_value` (numeric) - Valor da nota fiscal
      - `carrier_name` (text) - Nome da transportadora
      - `competencia` (timestamptz) - Data de competencia
      - `day_number` (integer) - Dia do mes
      - `month_name` (text) - Nome do mes
      - `year_number` (integer) - Ano
      - `invoice_number` (text) - Numero da fatura
      - `cte_number` (text) - CT-e
      - `quote_value` (numeric) - Cotacao
      - `freight_value` (numeric) - Valor do frete
      - `quote_vs_nf_pct` (numeric) - % cotacao x nota
      - `freight_vs_nf_pct` (numeric) - % frete x nota
      - `cost_value` (numeric) - Custo R$
      - `estimated_delivery` (date) - Previsao de entrega
      - `delivered_at` (timestamptz) - Entregue em
      - `status` (text) - Status da entrega
      - `business_days` (integer) - Dias uteis
      - `observations` (text) - Observacoes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Authenticated users can read all records
    - Admin/Manager users (type 1, 2, 5) can insert/update/delete
*/

-- Create freight_carriers table
CREATE TABLE IF NOT EXISTS freight_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE freight_carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view carriers"
  ON freight_carriers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert carriers"
  ON freight_carriers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'gestor', 'lider')
    )
  );

CREATE POLICY "Admins can update carriers"
  ON freight_carriers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'gestor', 'lider')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'gestor', 'lider')
    )
  );

CREATE POLICY "Admins can delete carriers"
  ON freight_carriers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'admin'
    )
  );

-- Create freight_records table
CREATE TABLE IF NOT EXISTS freight_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_date date NOT NULL,
  nf_number text,
  nature text,
  client_cnpj text,
  client_name text,
  destination_city text,
  destination_state text,
  destination_cep text,
  volume numeric DEFAULT 0,
  weight numeric DEFAULT 0,
  nf_value numeric DEFAULT 0,
  carrier_name text,
  competencia timestamptz,
  day_number integer,
  month_name text,
  year_number integer,
  invoice_number text,
  cte_number text,
  quote_value numeric DEFAULT 0,
  freight_value numeric DEFAULT 0,
  quote_vs_nf_pct numeric DEFAULT 0,
  freight_vs_nf_pct numeric DEFAULT 0,
  cost_value numeric DEFAULT 0,
  estimated_delivery date,
  delivered_at timestamptz,
  status text DEFAULT 'em_transporte',
  business_days integer DEFAULT 0,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE freight_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view freight records"
  ON freight_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert freight records"
  ON freight_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'gestor', 'lider')
    )
  );

CREATE POLICY "Admins can update freight records"
  ON freight_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'gestor', 'lider')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'gestor', 'lider')
    )
  );

CREATE POLICY "Admins can delete freight records"
  ON freight_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name = 'admin'
    )
  );

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_freight_records_shipment_date ON freight_records(shipment_date);
CREATE INDEX IF NOT EXISTS idx_freight_records_status ON freight_records(status);
CREATE INDEX IF NOT EXISTS idx_freight_records_carrier ON freight_records(carrier_name);
CREATE INDEX IF NOT EXISTS idx_freight_records_state ON freight_records(destination_state);

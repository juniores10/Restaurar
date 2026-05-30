/*
  # Create Logistics/Freight Management System

  1. New Tables
    - `freight_carriers` (transportadoras)
      - `id` (uuid, primary key)
      - `name` (text) - nome da transportadora
      - `cnpj` (text) - CNPJ da transportadora
      - `phone` (text) - telefone
      - `email` (text) - email de contato
      - `contact_person` (text) - pessoa de contato
      - `city` (text) - cidade
      - `state` (text) - UF
      - `is_active` (boolean) - status ativo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `freight_clients` (clientes de frete)
      - `id` (uuid, primary key)
      - `name` (text) - nome/razao social
      - `cnpj` (text) - CNPJ
      - `city` (text) - cidade
      - `state` (text) - UF
      - `cep` (text) - CEP
      - `is_active` (boolean)
      - `created_at` (timestamptz)

    - `freight_records` (lancamentos de frete)
      - `id` (uuid, primary key)
      - `shipment_date` (date) - data do envio
      - `delivery_date` (date) - data de entrega
      - `nf_number` (text) - numero da nota fiscal
      - `client_id` (uuid, FK) - cliente
      - `client_name` (text) - nome do cliente (denormalized)
      - `client_cnpj` (text) - CNPJ do cliente
      - `destination_city` (text) - cidade destino
      - `destination_state` (text) - UF destino
      - `destination_cep` (text) - CEP destino
      - `nature` (text) - natureza da operacao
      - `carrier_id` (uuid, FK) - transportadora
      - `carrier_name` (text) - nome transportadora (denormalized)
      - `volume` (numeric) - quantidade de volumes
      - `weight` (numeric) - peso em kg
      - `nf_value` (numeric) - valor da nota fiscal
      - `quote_value` (numeric) - valor da cotacao
      - `freight_value` (numeric) - valor do frete
      - `freight_percentage` (numeric) - percentual do frete sobre NF (calculado)
      - `cte_number` (text) - numero do CT-e
      - `invoice_number` (text) - numero da fatura
      - `status` (text) - status da entrega
      - `sla_days` (integer) - SLA em dias
      - `actual_days` (integer) - dias reais de entrega
      - `delay_days` (integer) - dias de atraso (calculado)
      - `observations` (text) - observacoes
      - `created_by` (uuid) - usuario que criou
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `freight_settings` (configuracoes do modulo)
      - `id` (uuid, primary key)
      - `default_sla_days` (integer) - SLA padrao em dias
      - `freight_percentage_target` (numeric) - meta de % frete
      - `alert_delay_days` (integer) - alertar apos X dias
      - `updated_by` (uuid)
      - `updated_at` (timestamptz)

    - `freight_audit_log` (log de auditoria)
      - `id` (uuid, primary key)
      - `freight_record_id` (uuid, FK)
      - `action` (text) - acao realizada
      - `old_values` (jsonb) - valores anteriores
      - `new_values` (jsonb) - novos valores
      - `performed_by` (uuid)
      - `performed_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Admin/Manager/Leader users can read and write
    - Employees can only view records
*/

-- Freight Carriers (Transportadoras)
CREATE TABLE IF NOT EXISTS freight_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  phone text,
  email text,
  contact_person text,
  city text,
  state text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE freight_carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view carriers"
  ON freight_carriers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can insert carriers"
  ON freight_carriers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  );

CREATE POLICY "Admins and managers can update carriers"
  ON freight_carriers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  );

CREATE POLICY "Admins can delete carriers"
  ON freight_carriers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

-- Freight Clients
CREATE TABLE IF NOT EXISTS freight_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  city text,
  state text,
  cep text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE freight_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view freight clients"
  ON freight_clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can insert freight clients"
  ON freight_clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  );

CREATE POLICY "Admins and managers can update freight clients"
  ON freight_clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  );

CREATE POLICY "Admins can delete freight clients"
  ON freight_clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

-- Freight Records (Lancamentos)
CREATE TABLE IF NOT EXISTS freight_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_date date NOT NULL,
  delivery_date date,
  nf_number text,
  client_id uuid REFERENCES freight_clients(id),
  client_name text,
  client_cnpj text,
  destination_city text,
  destination_state text,
  destination_cep text,
  nature text,
  carrier_id uuid REFERENCES freight_carriers(id),
  carrier_name text,
  volume numeric DEFAULT 0,
  weight numeric DEFAULT 0,
  nf_value numeric DEFAULT 0,
  quote_value numeric DEFAULT 0,
  freight_value numeric DEFAULT 0,
  freight_percentage numeric DEFAULT 0,
  cte_number text,
  invoice_number text,
  status text DEFAULT 'em_transporte',
  sla_days integer DEFAULT 3,
  actual_days integer,
  delay_days integer DEFAULT 0,
  observations text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE freight_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view freight records"
  ON freight_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can insert freight records"
  ON freight_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  );

CREATE POLICY "Admins and managers can update freight records"
  ON freight_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  );

CREATE POLICY "Admins can delete freight records"
  ON freight_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

-- Freight Settings
CREATE TABLE IF NOT EXISTS freight_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_sla_days integer DEFAULT 3,
  freight_percentage_target numeric DEFAULT 5.0,
  alert_delay_days integer DEFAULT 2,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE freight_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view freight settings"
  ON freight_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update freight settings"
  ON freight_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

CREATE POLICY "Admins can insert freight settings"
  ON freight_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

-- Freight Audit Log
CREATE TABLE IF NOT EXISTS freight_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_record_id uuid REFERENCES freight_records(id),
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid,
  performed_at timestamptz DEFAULT now()
);

ALTER TABLE freight_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view freight audit log"
  ON freight_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  );

CREATE POLICY "System can insert freight audit log"
  ON freight_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2, 5)
    )
  );

-- Insert default settings
INSERT INTO freight_settings (default_sla_days, freight_percentage_target, alert_delay_days)
VALUES (3, 5.0, 2);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_freight_records_shipment_date ON freight_records(shipment_date);
CREATE INDEX IF NOT EXISTS idx_freight_records_status ON freight_records(status);
CREATE INDEX IF NOT EXISTS idx_freight_records_carrier_id ON freight_records(carrier_id);
CREATE INDEX IF NOT EXISTS idx_freight_records_client_id ON freight_records(client_id);
CREATE INDEX IF NOT EXISTS idx_freight_audit_log_record_id ON freight_audit_log(freight_record_id);

/*
  # Factory Maintenance System (Manutenção Fábrica)

  1. New Tables
    - `maintenance_orders` - Main work orders table
      - `id` (uuid, primary key)
      - `order_number` (text, unique) - Auto-generated MNT-YYYYMM-NNNN
      - `title` (text) - Short description of the issue
      - `description` (text) - Detailed description
      - `fault_type` (text) - Elétrica, Operacional, Equipamento
      - `problem_origin` (text) - Operação, Manutenção, Projeto/Equipamento
      - `priority` (text) - Baixa, Média, Alta, Crítica
      - `status` (text) - Aberto, Em Andamento, Aguardando Peça, Concluído, Cancelado
      - `location` (text) - Where in the factory
      - `equipment` (text) - Which equipment
      - `requested_by` (uuid) - Employee who reported
      - `assigned_to` (uuid) - Technician assigned
      - `estimated_downtime_hours` (numeric) - Expected downtime
      - `actual_downtime_hours` (numeric) - Real downtime
      - `estimated_cost` (numeric) - Expected cost
      - `actual_cost` (numeric) - Real cost
      - `started_at` (timestamptz) - When work began
      - `completed_at` (timestamptz) - When work finished
      - `resolution_notes` (text) - How it was resolved
      - `created_at`, `updated_at` (timestamptz)

    - `maintenance_comments` - Comments/updates on orders
      - `id` (uuid, primary key)
      - `order_id` (uuid, FK to maintenance_orders)
      - `user_id` (uuid, FK to auth.users)
      - `comment` (text)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Authenticated users can read all orders
    - Admins can create/update/delete orders and comments
*/

-- Maintenance Orders table
CREATE TABLE IF NOT EXISTS maintenance_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  fault_type text NOT NULL CHECK (fault_type IN ('Elétrica', 'Operacional', 'Equipamento')),
  problem_origin text NOT NULL CHECK (problem_origin IN ('Operação (erro humano/procedimento)', 'Manutenção (execução/instalação)', 'Projeto/Equipamento (defeito/desgaste)')),
  priority text NOT NULL DEFAULT 'Média' CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  status text NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Andamento', 'Aguardando Peça', 'Concluído', 'Cancelado')),
  location text DEFAULT '',
  equipment text DEFAULT '',
  requested_by text DEFAULT '',
  assigned_to text DEFAULT '',
  estimated_downtime_hours numeric DEFAULT 0,
  actual_downtime_hours numeric DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  resolution_notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;

-- Maintenance Comments table
CREATE TABLE IF NOT EXISTS maintenance_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES maintenance_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_comments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_status ON maintenance_orders(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_fault_type ON maintenance_orders(fault_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_problem_origin ON maintenance_orders(problem_origin);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_priority ON maintenance_orders(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_created_at ON maintenance_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_comments_order_id ON maintenance_comments(order_id);

-- RLS Policies for maintenance_orders
CREATE POLICY "Authenticated users can read maintenance orders"
  ON maintenance_orders FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert maintenance orders"
  ON maintenance_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_types ut
      JOIN employees e ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

CREATE POLICY "Admins can update maintenance orders"
  ON maintenance_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_types ut
      JOIN employees e ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_types ut
      JOIN employees e ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

CREATE POLICY "Admins can delete maintenance orders"
  ON maintenance_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_types ut
      JOIN employees e ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('admin', 'Administrador')
    )
  );

-- RLS Policies for maintenance_comments
CREATE POLICY "Authenticated users can read maintenance comments"
  ON maintenance_comments FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert maintenance comments"
  ON maintenance_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own maintenance comments"
  ON maintenance_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_maintenance_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_maintenance_orders_updated_at ON maintenance_orders;
CREATE TRIGGER trigger_update_maintenance_orders_updated_at
  BEFORE UPDATE ON maintenance_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_orders_updated_at();

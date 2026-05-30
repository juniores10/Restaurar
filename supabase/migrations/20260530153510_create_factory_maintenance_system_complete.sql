/*
  # Create Factory Maintenance System (All Tables)

  This migration creates all tables needed for the factory maintenance module
  that were previously missing from the database.

  1. New Tables
    - `maintenance_specialties` - Technical specialties/skills
    - `maintenance_locations` - Factory locations for maintenance
    - `maintenance_equipment` - Registered equipment/machines
    - `maintenance_occurrences` - Occurrence/stoppage types
    - `maintenance_materials` - Materials, parts, and misc items
    - `maintenance_technicians` - Registered maintenance technicians
    - `maintenance_orders` - Main work orders
    - `maintenance_comments` - Comments on orders
    - `maintenance_material_equipment` - Junction table for materials-equipment
    - `maintenance_request_notifications` - Approval workflow notifications

  2. Security
    - RLS enabled on all tables
    - Authenticated users can SELECT
    - Only admins (user_type_id = 1) can INSERT/UPDATE/DELETE on cadastro tables
    - All authenticated users can create maintenance orders

  3. Triggers
    - Auto-update updated_at on maintenance_orders
    - Notify admins on new maintenance order
*/

-- Maintenance Specialties
CREATE TABLE IF NOT EXISTS maintenance_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance specialties"
  ON maintenance_specialties FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert maintenance specialties"
  ON maintenance_specialties FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can update maintenance specialties"
  ON maintenance_specialties FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can delete maintenance specialties"
  ON maintenance_specialties FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Locations
CREATE TABLE IF NOT EXISTS maintenance_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance locations"
  ON maintenance_locations FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert maintenance locations"
  ON maintenance_locations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can update maintenance locations"
  ON maintenance_locations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can delete maintenance locations"
  ON maintenance_locations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Equipment
CREATE TABLE IF NOT EXISTS maintenance_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tag_code text DEFAULT '',
  location_id uuid REFERENCES maintenance_locations(id) ON DELETE SET NULL,
  inactivation_reason text DEFAULT '',
  hourly_cost numeric(12, 2) NOT NULL DEFAULT 0,
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance equipment"
  ON maintenance_equipment FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert maintenance equipment"
  ON maintenance_equipment FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can update maintenance equipment"
  ON maintenance_equipment FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can delete maintenance equipment"
  ON maintenance_equipment FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Occurrences
CREATE TABLE IF NOT EXISTS maintenance_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance occurrences"
  ON maintenance_occurrences FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert maintenance occurrences"
  ON maintenance_occurrences FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can update maintenance occurrences"
  ON maintenance_occurrences FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can delete maintenance occurrences"
  ON maintenance_occurrences FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Materials
CREATE TABLE IF NOT EXISTS maintenance_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text DEFAULT 'un',
  equipment_id uuid REFERENCES maintenance_equipment(id) ON DELETE SET NULL,
  warehouse_code text DEFAULT '',
  description text DEFAULT '',
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance materials"
  ON maintenance_materials FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert maintenance materials"
  ON maintenance_materials FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can update maintenance materials"
  ON maintenance_materials FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can delete maintenance materials"
  ON maintenance_materials FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Technicians
CREATE TABLE IF NOT EXISTS maintenance_technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty_id uuid REFERENCES maintenance_specialties(id) ON DELETE SET NULL,
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance_technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance technicians"
  ON maintenance_technicians FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert maintenance technicians"
  ON maintenance_technicians FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can update maintenance technicians"
  ON maintenance_technicians FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can delete maintenance technicians"
  ON maintenance_technicians FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Orders
CREATE TABLE IF NOT EXISTS maintenance_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  fault_type text NOT NULL,
  problem_origin text NOT NULL CHECK (problem_origin IN ('Operação (erro humano/procedimento)', 'Manutenção (execução/instalação)', 'Projeto/Equipamento (defeito/desgaste)')),
  priority text NOT NULL DEFAULT 'Média' CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  status text NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Andamento', 'Aguardando Peça', 'Concluído', 'Cancelado')),
  maintenance_type text NOT NULL DEFAULT 'Corretiva',
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
  approval_status text NOT NULL DEFAULT 'pending',
  approval_action_by text,
  approval_action_at timestamptz,
  rejection_reason text,
  service_order_data jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance orders"
  ON maintenance_orders FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create maintenance orders"
  ON maintenance_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update maintenance orders"
  ON maintenance_orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));
CREATE POLICY "Admins can delete maintenance orders"
  ON maintenance_orders FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Comments
CREATE TABLE IF NOT EXISTS maintenance_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES maintenance_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance comments"
  ON maintenance_comments FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert maintenance comments"
  ON maintenance_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own maintenance comments"
  ON maintenance_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Maintenance Material Equipment Junction
CREATE TABLE IF NOT EXISTS maintenance_material_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES maintenance_materials(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES maintenance_equipment(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (material_id, equipment_id)
);
ALTER TABLE maintenance_material_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view material equipment links"
  ON maintenance_material_equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert material equipment links"
  ON maintenance_material_equipment FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete material equipment links"
  ON maintenance_material_equipment FOR DELETE TO authenticated USING (true);

-- Maintenance Request Notifications
CREATE TABLE IF NOT EXISTS maintenance_request_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES maintenance_orders(id) ON DELETE CASCADE,
  recipient_auth_user_id uuid NOT NULL,
  recipient_name text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  actioned boolean NOT NULL DEFAULT false,
  action_taken text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE maintenance_request_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own maintenance notifications"
  ON maintenance_request_notifications FOR SELECT TO authenticated
  USING (recipient_auth_user_id = auth.uid());
CREATE POLICY "Authenticated users can insert maintenance notifications"
  ON maintenance_request_notifications FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Authenticated users can update own maintenance notifications"
  ON maintenance_request_notifications FOR UPDATE TO authenticated
  USING (recipient_auth_user_id = auth.uid())
  WITH CHECK (recipient_auth_user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_status ON maintenance_orders(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_fault_type ON maintenance_orders(fault_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_problem_origin ON maintenance_orders(problem_origin);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_priority ON maintenance_orders(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_created_at ON maintenance_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_comments_order_id ON maintenance_comments(order_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_location ON maintenance_equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_technicians_specialty ON maintenance_technicians(specialty_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_status ON maintenance_equipment(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_technicians_status ON maintenance_technicians(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_locations_status ON maintenance_locations(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_specialties_status ON maintenance_specialties(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_status ON maintenance_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_materials_status ON maintenance_materials(status);
CREATE INDEX IF NOT EXISTS idx_maint_notif_recipient ON maintenance_request_notifications(recipient_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_maint_notif_order ON maintenance_request_notifications(order_id);

-- Triggers
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

CREATE OR REPLACE FUNCTION notify_admin_on_maintenance_order()
RETURNS TRIGGER AS $$
DECLARE
  employee_record RECORD;
  notif_title TEXT;
  notif_message TEXT;
BEGIN
  SELECT id, name INTO employee_record
  FROM employees
  WHERE auth_user_id = NEW.created_by
  LIMIT 1;

  notif_title := 'Novo Chamado de Manutencao: ' || NEW.order_number;
  notif_message := COALESCE(employee_record.name, 'Usuario') || ' abriu o chamado "' || NEW.title || '" [' || NEW.priority || ' - ' || NEW.fault_type || ']';

  INSERT INTO admin_notifications (type, title, message, employee_id, reference_id, reference_type, is_read)
  VALUES (
    'maintenance_order',
    notif_title,
    notif_message,
    employee_record.id,
    NEW.id,
    'maintenance_order',
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admin_on_maintenance_order ON maintenance_orders;
CREATE TRIGGER trigger_notify_admin_on_maintenance_order
  AFTER INSERT ON maintenance_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_maintenance_order();

/*
  # Sistema de Agenda de Eventos

  1. Novas Tabelas
    - `event_types`
      - `id` (uuid, chave primaria)
      - `name` (text, nome do tipo de evento - Curso, Inventario, Atividade, etc.)
      - `color` (text, cor para exibicao)
      - `icon` (text, icone para exibicao)
      - `is_active` (boolean, se o tipo esta ativo)
      - `created_at` (timestamptz)
    
    - `calendar_events`
      - `id` (uuid, chave primaria)
      - `title` (text, titulo do evento)
      - `description` (text, descricao detalhada)
      - `event_type_id` (uuid, referencia ao tipo de evento)
      - `start_date` (date, data de inicio)
      - `end_date` (date, data de fim)
      - `start_time` (time, hora de inicio)
      - `end_time` (time, hora de fim)
      - `location` (text, local do evento)
      - `is_mandatory` (boolean, se e obrigatorio)
      - `created_by` (uuid, quem criou o evento)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `event_assignments`
      - `id` (uuid, chave primaria)
      - `event_id` (uuid, referencia ao evento)
      - `employee_id` (uuid, referencia ao colaborador)
      - `status` (text, status da atribuicao)
      - `notes` (text, observacoes)
      - `assigned_by` (uuid, quem atribuiu)
      - `assigned_at` (timestamptz)
      - `confirmed_at` (timestamptz)

  2. Seguranca
    - RLS habilitado em todas as tabelas
    - Admins e gestores podem gerenciar eventos
    - Colaboradores podem ver apenas seus eventos atribuidos
*/

-- Criar tabela de tipos de evento
CREATE TABLE IF NOT EXISTS event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  icon text NOT NULL DEFAULT 'calendar',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

-- Criar tabela de eventos
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type_id uuid REFERENCES event_types(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  is_mandatory boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Criar tabela de atribuicoes
CREATE TABLE IF NOT EXISTS event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  notes text,
  assigned_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  UNIQUE(event_id, employee_id)
);

ALTER TABLE event_assignments ENABLE ROW LEVEL SECURITY;

-- Inserir tipos de evento padrao
INSERT INTO event_types (name, color, icon) VALUES
  ('Curso', '#3B82F6', 'graduation-cap'),
  ('Inventario', '#F59E0B', 'clipboard-list'),
  ('Atividade', '#10B981', 'activity'),
  ('Reuniao', '#8B5CF6', 'users'),
  ('Treinamento', '#EC4899', 'book-open'),
  ('Outro', '#6B7280', 'calendar')
ON CONFLICT DO NOTHING;

-- Politicas para event_types
CREATE POLICY "Authenticated users can view active event types"
  ON event_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage event types"
  ON event_types
  FOR ALL
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

-- Politicas para calendar_events
CREATE POLICY "Admins can manage calendar events"
  ON calendar_events
  FOR ALL
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

CREATE POLICY "Employees can view events assigned to them"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_assignments ea
      JOIN employees e ON ea.employee_id = e.id
      WHERE ea.event_id = calendar_events.id
      AND e.auth_user_id = auth.uid()
    )
  );

-- Politicas para event_assignments
CREATE POLICY "Admins can manage event assignments"
  ON event_assignments
  FOR ALL
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

CREATE POLICY "Employees can view their own assignments"
  ON event_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = event_assignments.employee_id
      AND e.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update their own assignment status"
  ON event_assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = event_assignments.employee_id
      AND e.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = event_assignments.employee_id
      AND e.auth_user_id = auth.uid()
    )
  );

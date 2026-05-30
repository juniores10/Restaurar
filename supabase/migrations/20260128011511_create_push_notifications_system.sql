/*
  # Sistema de Notificacoes Push para Colaboradores

  1. Nova Tabela
    - `push_notifications`
      - `id` (uuid, primary key)
      - `title` (text) - Titulo da notificacao
      - `message` (text) - Corpo da mensagem
      - `notification_type` (text) - Tipo: email, whatsapp, both
      - `priority` (text) - Prioridade: low, normal, high, urgent
      - `target_type` (text) - Alvo: all, department, role, specific
      - `target_ids` (uuid[]) - IDs dos destinatarios especificos
      - `target_department_id` (uuid) - Departamento alvo
      - `target_role_id` (uuid) - Cargo alvo
      - `created_by` (uuid) - Admin/Gestor que criou
      - `scheduled_at` (timestamptz) - Agendamento opcional
      - `sent_at` (timestamptz) - Quando foi enviada
      - `status` (text) - pending, sent, failed, cancelled
      - `email_subject` (text) - Assunto do email
      - `whatsapp_template` (text) - Template WhatsApp
      - `metadata` (jsonb) - Dados extras
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `push_notification_recipients`
      - `id` (uuid, primary key)
      - `notification_id` (uuid) - FK para push_notifications
      - `employee_id` (uuid) - FK para employees
      - `email_status` (text) - pending, sent, delivered, failed
      - `whatsapp_status` (text) - pending, sent, delivered, read, failed
      - `email_sent_at` (timestamptz)
      - `whatsapp_sent_at` (timestamptz)
      - `email_error` (text)
      - `whatsapp_error` (text)
      - `read_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Seguranca
    - RLS habilitado em ambas as tabelas
    - Apenas admin/gestor pode criar/editar notificacoes
    - Colaboradores podem ver suas proprias notificacoes
*/

-- Criar tabela de notificacoes push
CREATE TABLE IF NOT EXISTS push_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'email' CHECK (notification_type IN ('email', 'whatsapp', 'both')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_type text NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'department', 'role', 'specific')),
  target_ids uuid[] DEFAULT '{}',
  target_department_id uuid REFERENCES data_types(id) ON DELETE SET NULL,
  target_role_id uuid REFERENCES data_types(id) ON DELETE SET NULL,
  created_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sending', 'sent', 'partial', 'failed', 'cancelled')),
  email_subject text,
  whatsapp_template text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de destinatarios
CREATE TABLE IF NOT EXISTS push_notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  email_status text DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'delivered', 'failed', 'skipped')),
  whatsapp_status text DEFAULT 'pending' CHECK (whatsapp_status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'skipped')),
  email_sent_at timestamptz,
  whatsapp_sent_at timestamptz,
  email_error text,
  whatsapp_error text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(notification_id, employee_id)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_push_notifications_created_by ON push_notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_push_notifications_scheduled_at ON push_notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_push_notification_recipients_notification ON push_notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_recipients_employee ON push_notification_recipients(employee_id);

-- Habilitar RLS
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_recipients ENABLE ROW LEVEL SECURITY;

-- Politicas para push_notifications
CREATE POLICY "Admin and managers can view all notifications"
  ON push_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  );

CREATE POLICY "Admin and managers can create notifications"
  ON push_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  );

CREATE POLICY "Admin and managers can update notifications"
  ON push_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  );

CREATE POLICY "Admin and managers can delete notifications"
  ON push_notifications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  );

-- Politicas para push_notification_recipients
CREATE POLICY "Admin and managers can view all recipients"
  ON push_notification_recipients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  );

CREATE POLICY "Employees can view their own notifications"
  ON push_notification_recipients FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and managers can manage recipients"
  ON push_notification_recipients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  );

CREATE POLICY "Admin and managers can update recipients"
  ON push_notification_recipients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  );

CREATE POLICY "Employees can mark own notifications as read"
  ON push_notification_recipients FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and managers can delete recipients"
  ON push_notification_recipients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor')
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_push_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_notifications_updated_at ON push_notifications;
CREATE TRIGGER push_notifications_updated_at
  BEFORE UPDATE ON push_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_push_notifications_updated_at();
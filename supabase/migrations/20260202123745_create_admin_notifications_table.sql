/*
  # Criar Tabela de Notificações para Administradores

  1. Nova Tabela
    - `admin_notifications` - Armazena notificações para administradores/gerentes
      - `id` (uuid, primary key)
      - `type` (text) - Tipo de notificação (submission, suggestion, notice_view, document_read)
      - `title` (text) - Título da notificação
      - `message` (text) - Mensagem descritiva
      - `employee_id` (uuid) - ID do funcionário que gerou a notificação
      - `reference_id` (uuid) - ID do registro relacionado
      - `reference_type` (text) - Tipo do registro (employee_submissions, suggestions, etc)
      - `is_read` (boolean) - Se foi lida ou não
      - `created_at` (timestamptz) - Data de criação

  2. Segurança
    - RLS habilitado
    - Apenas admins (user_type_id 1 ou 2) podem visualizar e marcar como lidas
    - Sistema pode inserir notificações automaticamente via triggers
*/

CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  reference_id uuid,
  reference_type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Política para admins visualizarem notificações
DROP POLICY IF EXISTS "Admins can view all notifications" ON admin_notifications;
CREATE POLICY "Admins can view all notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

-- Política para admins atualizarem notificações (marcar como lida)
DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
CREATE POLICY "Admins can update notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

-- Política para sistema inserir notificações via triggers
DROP POLICY IF EXISTS "System can insert notifications" ON admin_notifications;
CREATE POLICY "System can insert notifications"
  ON admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_employee_id 
  ON admin_notifications(employee_id);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read 
  ON admin_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at 
  ON admin_notifications(created_at DESC);

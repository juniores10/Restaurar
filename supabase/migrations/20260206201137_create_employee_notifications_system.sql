/*
  # Create Employee Notifications System

  1. New Tables
    - `employee_notifications`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `type` (text) - notification type
      - `title` (text) - notification title
      - `message` (text) - notification message
      - `reference_id` (uuid) - reference to the related record
      - `reference_type` (text) - type of referenced record
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `employee_notifications` table
    - Employees can view only their own notifications
    - Employees can update only their own notifications
    - Admins can view all employee notifications
    - System can insert via triggers

  3. Triggers
    - On employee_submissions INSERT: notify employee document sent
    - On suggestions INSERT: notify employee suggestion registered
    - On notice_views INSERT: notify employee notice viewed
    - On document_reads INSERT: notify employee document viewed
    - On suggestions UPDATE (admin_response): notify employee of response

  4. Indexes
    - employee_id, is_read, created_at, unique reference constraint
*/

CREATE TABLE IF NOT EXISTS employee_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reference_id uuid,
  reference_type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own notifications"
  ON employee_notifications
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update own notifications"
  ON employee_notifications
  FOR UPDATE
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

CREATE POLICY "System can insert employee notifications"
  ON employee_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all employee notifications"
  ON employee_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE INDEX IF NOT EXISTS idx_employee_notifications_employee_id
  ON employee_notifications(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_notifications_is_read
  ON employee_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_employee_notifications_created_at
  ON employee_notifications(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS employee_notifications_unique_ref
  ON employee_notifications (employee_id, reference_id, reference_type, type)
  WHERE reference_id IS NOT NULL;

-- Notify employee on document submission
CREATE OR REPLACE FUNCTION notify_employee_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO employee_notifications (employee_id, type, title, message, reference_id, reference_type)
  VALUES (
    NEW.employee_id,
    'submission',
    'Documento Enviado',
    'Seu documento "' || NEW.title || '" foi enviado com sucesso.',
    NEW.id,
    'employee_submissions'
  )
  ON CONFLICT (employee_id, reference_id, reference_type, type) WHERE reference_id IS NOT NULL DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify employee on suggestion
CREATE OR REPLACE FUNCTION notify_employee_on_suggestion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO employee_notifications (employee_id, type, title, message, reference_id, reference_type)
  VALUES (
    NEW.employee_id,
    'suggestion',
    'Sugestao Registrada',
    'Sua sugestao "' || NEW.title || '" foi registrada com sucesso.',
    NEW.id,
    'suggestions'
  )
  ON CONFLICT (employee_id, reference_id, reference_type, type) WHERE reference_id IS NOT NULL DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify employee on notice view
CREATE OR REPLACE FUNCTION notify_employee_on_notice_view()
RETURNS TRIGGER AS $$
DECLARE
  notice_title_val TEXT;
BEGIN
  SELECT title INTO notice_title_val FROM notices WHERE id = NEW.notice_id;
  INSERT INTO employee_notifications (employee_id, type, title, message, reference_id, reference_type)
  VALUES (
    NEW.employee_id,
    'notice_view',
    'Aviso Visualizado',
    'Voce visualizou o aviso: "' || COALESCE(notice_title_val, 'Sem titulo') || '".',
    NEW.notice_id,
    'notices'
  )
  ON CONFLICT (employee_id, reference_id, reference_type, type) WHERE reference_id IS NOT NULL DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify employee on document read
CREATE OR REPLACE FUNCTION notify_employee_on_document_read()
RETURNS TRIGGER AS $$
DECLARE
  doc_title_val TEXT;
BEGIN
  SELECT title INTO doc_title_val FROM shared_documents WHERE id = NEW.document_id;
  INSERT INTO employee_notifications (employee_id, type, title, message, reference_id, reference_type)
  VALUES (
    NEW.employee_id,
    'document_read',
    'Documento Visualizado',
    'Voce visualizou o documento: "' || COALESCE(doc_title_val, 'Sem titulo') || '".',
    NEW.document_id,
    'shared_documents'
  )
  ON CONFLICT (employee_id, reference_id, reference_type, type) WHERE reference_id IS NOT NULL DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify employee when admin responds to suggestion
CREATE OR REPLACE FUNCTION notify_employee_on_suggestion_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_response IS NOT NULL AND (OLD.admin_response IS NULL OR OLD.admin_response <> NEW.admin_response) THEN
    INSERT INTO employee_notifications (employee_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.employee_id,
      'suggestion_response',
      'Resposta a Sugestao',
      'Sua sugestao "' || NEW.title || '" recebeu uma resposta do administrador.',
      NEW.id,
      'suggestions'
    )
    ON CONFLICT (employee_id, reference_id, reference_type, type) WHERE reference_id IS NOT NULL
    DO UPDATE SET
      message = EXCLUDED.message,
      is_read = false,
      created_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_employee_submission_notify_employee ON employee_submissions;
CREATE TRIGGER on_employee_submission_notify_employee
  AFTER INSERT ON employee_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_employee_on_submission();

DROP TRIGGER IF EXISTS on_suggestion_notify_employee ON suggestions;
CREATE TRIGGER on_suggestion_notify_employee
  AFTER INSERT ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION notify_employee_on_suggestion();

DROP TRIGGER IF EXISTS on_notice_view_notify_employee ON notice_views;
CREATE TRIGGER on_notice_view_notify_employee
  AFTER INSERT ON notice_views
  FOR EACH ROW
  EXECUTE FUNCTION notify_employee_on_notice_view();

DROP TRIGGER IF EXISTS on_document_read_notify_employee ON document_reads;
CREATE TRIGGER on_document_read_notify_employee
  AFTER INSERT ON document_reads
  FOR EACH ROW
  EXECUTE FUNCTION notify_employee_on_document_read();

DROP TRIGGER IF EXISTS on_suggestion_response_notify_employee ON suggestions;
CREATE TRIGGER on_suggestion_response_notify_employee
  AFTER UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION notify_employee_on_suggestion_response();
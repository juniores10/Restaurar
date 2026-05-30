/*
  # Create Admin Notification Triggers
  
  1. Purpose
    - Automatically create notifications for admins/managers when employees take actions
    - Track document submissions, suggestions, notice views, and document reads
  
  2. Notification Types
    - 'submission': Employee submitted a document
    - 'suggestion': Employee submitted a suggestion
    - 'notice_view': Employee viewed a notice
    - 'document_read': Employee read a shared document
  
  3. Triggers Created
    - On INSERT to employee_submissions: Creates notification for new document submission
    - On INSERT to suggestions: Creates notification for new suggestion
    - On INSERT to notice_views: Creates notification when employee views a notice
    - On INSERT to document_reads: Creates notification when employee reads a document
  
  4. Security
    - Admin notifications table already has RLS enabled
    - Only admins/managers can view notifications
*/

-- Function to create notification for document submission
CREATE OR REPLACE FUNCTION notify_admin_on_submission()
RETURNS TRIGGER AS $$
DECLARE
  emp_name TEXT;
BEGIN
  SELECT name INTO emp_name FROM employees WHERE id = NEW.employee_id;
  
  INSERT INTO admin_notifications (type, title, message, employee_id, reference_id, reference_type)
  VALUES (
    'submission',
    'Novo Documento Enviado',
    emp_name || ' enviou um documento: ' || NEW.title,
    NEW.employee_id,
    NEW.id,
    'employee_submissions'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for new suggestion
CREATE OR REPLACE FUNCTION notify_admin_on_suggestion()
RETURNS TRIGGER AS $$
DECLARE
  emp_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  IF NEW.is_anonymous = true THEN
    notification_title := 'Nova Sugestao Anonima';
    notification_message := 'Um colaborador enviou uma sugestao anonima: ' || NEW.title;
  ELSE
    SELECT name INTO emp_name FROM employees WHERE id = NEW.employee_id;
    notification_title := 'Nova Sugestao';
    notification_message := COALESCE(emp_name, 'Colaborador') || ' enviou uma sugestao: ' || NEW.title;
  END IF;
  
  INSERT INTO admin_notifications (type, title, message, employee_id, reference_id, reference_type)
  VALUES (
    'suggestion',
    notification_title,
    notification_message,
    NEW.employee_id,
    NEW.id,
    'suggestions'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when employee views a notice
CREATE OR REPLACE FUNCTION notify_admin_on_notice_view()
RETURNS TRIGGER AS $$
DECLARE
  emp_name TEXT;
  notice_title TEXT;
BEGIN
  SELECT name INTO emp_name FROM employees WHERE id = NEW.employee_id;
  SELECT title INTO notice_title FROM notices WHERE id = NEW.notice_id;
  
  INSERT INTO admin_notifications (type, title, message, employee_id, reference_id, reference_type)
  VALUES (
    'notice_view',
    'Aviso Visualizado',
    COALESCE(emp_name, 'Colaborador') || ' visualizou o aviso: ' || COALESCE(notice_title, 'Sem titulo'),
    NEW.employee_id,
    NEW.notice_id,
    'notices'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when employee reads a shared document
CREATE OR REPLACE FUNCTION notify_admin_on_document_read()
RETURNS TRIGGER AS $$
DECLARE
  emp_name TEXT;
  doc_title TEXT;
BEGIN
  SELECT name INTO emp_name FROM employees WHERE id = NEW.employee_id;
  SELECT title INTO doc_title FROM shared_documents WHERE id = NEW.document_id;
  
  INSERT INTO admin_notifications (type, title, message, employee_id, reference_id, reference_type)
  VALUES (
    'document_read',
    'Documento Lido',
    COALESCE(emp_name, 'Colaborador') || ' leu o documento: ' || COALESCE(doc_title, 'Sem titulo'),
    NEW.employee_id,
    NEW.document_id,
    'shared_documents'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_employee_submission_notify ON employee_submissions;
CREATE TRIGGER on_employee_submission_notify
  AFTER INSERT ON employee_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_submission();

DROP TRIGGER IF EXISTS on_suggestion_notify ON suggestions;
CREATE TRIGGER on_suggestion_notify
  AFTER INSERT ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_suggestion();

DROP TRIGGER IF EXISTS on_notice_view_notify ON notice_views;
CREATE TRIGGER on_notice_view_notify
  AFTER INSERT ON notice_views
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_notice_view();

DROP TRIGGER IF EXISTS on_document_read_notify ON document_reads;
CREATE TRIGGER on_document_read_notify
  AFTER INSERT ON document_reads
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_document_read();

-- Update RLS policies for admin_notifications to allow admins to read and update
DROP POLICY IF EXISTS "Admins can view all notifications" ON admin_notifications;
CREATE POLICY "Admins can view all notifications"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
CREATE POLICY "Admins can update notifications"
  ON admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

DROP POLICY IF EXISTS "System can insert notifications" ON admin_notifications;
CREATE POLICY "System can insert notifications"
  ON admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

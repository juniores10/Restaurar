/*
  # Prevent Duplicate Admin Notifications
  
  1. Purpose
    - Add unique constraint to prevent duplicate notifications
    - Update trigger functions to check for existing notifications before inserting
  
  2. Changes
    - Add unique index on (reference_id, reference_type, type) to prevent duplicates
    - Update trigger functions to use ON CONFLICT DO NOTHING
*/

-- Create unique index to prevent duplicate notifications for the same reference
CREATE UNIQUE INDEX IF NOT EXISTS admin_notifications_unique_ref 
ON admin_notifications (reference_id, reference_type, type) 
WHERE reference_id IS NOT NULL;

-- Update function to prevent duplicate submission notifications
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
    COALESCE(emp_name, 'Colaborador') || ' enviou um documento: ' || NEW.title,
    NEW.employee_id,
    NEW.id,
    'employee_submissions'
  )
  ON CONFLICT (reference_id, reference_type, type) WHERE reference_id IS NOT NULL DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function to prevent duplicate suggestion notifications
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
  )
  ON CONFLICT (reference_id, reference_type, type) WHERE reference_id IS NOT NULL DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function to prevent duplicate notice view notifications
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
  )
  ON CONFLICT (reference_id, reference_type, type) WHERE reference_id IS NOT NULL DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function to prevent duplicate document read notifications
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
  )
  ON CONFLICT (reference_id, reference_type, type) WHERE reference_id IS NOT NULL DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
  # Fix Time Tracking Uploads Update Policy

  1. Changes
    - Add UPDATE policy for time_tracking_uploads table
    - Admins and managers need to be able to update upload status

  2. Security
    - Only admins and managers can update upload records
    - This is needed for the Edge Function to update status after processing
*/

-- Add UPDATE policy for time_tracking_uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'time_tracking_uploads' 
    AND policyname = 'Admins and managers can update uploads'
  ) THEN
    CREATE POLICY "Admins and managers can update uploads"
      ON time_tracking_uploads
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM employees
          WHERE employees.auth_user_id = auth.uid()
          AND employees.user_type_id IN (
            SELECT id FROM user_types WHERE name IN ('Administrador', 'Gestor')
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM employees
          WHERE employees.auth_user_id = auth.uid()
          AND employees.user_type_id IN (
            SELECT id FROM user_types WHERE name IN ('Administrador', 'Gestor')
          )
        )
      );
  END IF;
END $$;

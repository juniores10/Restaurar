/*
  # Create equipment-manuals storage bucket and policies

  Creates a public storage bucket for equipment manual PDFs and sets up
  RLS policies using the correct user_types join pattern.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-manuals', 'equipment-manuals', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admins can upload equipment manuals' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admins can upload equipment manuals"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'equipment-manuals' AND
        EXISTS (
          SELECT 1 FROM employees e
          JOIN user_types ut ON e.user_type_id = ut.id
          WHERE e.auth_user_id = auth.uid()
          AND ut.name IN ('Administrador', 'Gestor', 'Lider')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admins can update equipment manuals' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admins can update equipment manuals"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'equipment-manuals' AND
        EXISTS (
          SELECT 1 FROM employees e
          JOIN user_types ut ON e.user_type_id = ut.id
          WHERE e.auth_user_id = auth.uid()
          AND ut.name IN ('Administrador', 'Gestor', 'Lider')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admins can delete equipment manuals' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admins can delete equipment manuals"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'equipment-manuals' AND
        EXISTS (
          SELECT 1 FROM employees e
          JOIN user_types ut ON e.user_type_id = ut.id
          WHERE e.auth_user_id = auth.uid()
          AND ut.name IN ('Administrador', 'Gestor', 'Lider')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated users can read equipment manuals' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can read equipment manuals"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'equipment-manuals');
  END IF;
END $$;

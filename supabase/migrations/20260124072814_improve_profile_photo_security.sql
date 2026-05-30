/*
  # Melhorar seguranca das fotos de perfil

  1. Alteracoes de Seguranca
    - Atualiza politicas do bucket profile-photos
    - Cada usuario so pode fazer upload/atualizar/deletar fotos no seu proprio caminho
    - O caminho da foto usa o ID do funcionario para garantir isolamento

  2. Logica de Seguranca
    - Upload: usuario so pode criar arquivos que comecam com seu employee ID
    - Update: usuario so pode atualizar arquivos que comecam com seu employee ID
    - Delete: usuario so pode deletar arquivos que comecam com seu employee ID
*/

DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their profile photos" ON storage.objects;

CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = 'employees' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND (storage.filename(name) LIKE employees.id::text || '-%')
    )
  );

CREATE POLICY "Users can update their own profile photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = 'employees' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND (storage.filename(name) LIKE employees.id::text || '-%')
    )
  )
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = 'employees' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND (storage.filename(name) LIKE employees.id::text || '-%')
    )
  );

CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = 'employees' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND (storage.filename(name) LIKE employees.id::text || '-%')
    )
  );
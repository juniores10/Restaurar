/*
  # Corrigir políticas de fotos de perfil

  1. Alterações
    - Remove políticas antigas com erro de sintaxe
    - Recria políticas corretas para usuários fazerem upload de suas próprias fotos

  2. Correção
    - Corrige `storage.filename(employees.name)` para `storage.filename(name)`
    - Garante que as políticas funcionem corretamente
*/

DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

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
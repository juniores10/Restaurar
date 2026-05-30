/*
  # Adicionar políticas de administrador para fotos de perfil

  1. Alterações de Segurança
    - Permite que administradores façam upload de fotos de qualquer funcionário
    - Permite que administradores atualizem fotos de qualquer funcionário
    - Permite que administradores deletem fotos de qualquer funcionário

  2. Lógica de Segurança
    - Verifica se o usuário tem user_type_id = 1 (Administrador)
    - Administradores podem gerenciar todas as fotos no bucket profile-photos
*/

CREATE POLICY "Admins can upload any profile photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

CREATE POLICY "Admins can update any profile photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  )
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );

CREATE POLICY "Admins can delete any profile photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id = 1
    )
  );
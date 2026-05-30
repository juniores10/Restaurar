/*
  # Corrigir politicas de fotos de perfil para Gestores

  1. Alteracoes
    - Remove politicas antigas de admin para fotos
    - Recria politicas permitindo tanto Administradores (user_type_id = 1) quanto Gestores (user_type_id = 2)
    - Garante que gestores possam fazer upload de fotos de colaboradores

  2. Seguranca
    - Apenas usuarios autenticados com perfil de Administrador ou Gestor podem gerenciar fotos
*/

DROP POLICY IF EXISTS "Admins can upload any profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update any profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any profile photos" ON storage.objects;

CREATE POLICY "Admins and Managers can upload any profile photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins and Managers can update any profile photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  )
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

CREATE POLICY "Admins and Managers can delete any profile photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (1, 2)
    )
  );

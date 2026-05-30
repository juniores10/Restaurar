/*
  # Corrigir Políticas RLS de Feriados

  1. Problema
    - Ao tentar excluir um feriado (que na verdade faz soft delete com UPDATE status = 1)
    - A política SELECT só permite ver feriados com status = 0
    - PostgreSQL verifica após UPDATE se ainda pode SELECT o registro
    - Como status mudou para 1, a verificação falha

  2. Solução
    - Criar política SELECT específica para administradores
    - Admins podem ver TODOS os feriados (incluindo inativos com status = 1)
    - Isso permite que o UPDATE seja completado com sucesso

  3. Segurança
    - Usuários comuns continuam vendo apenas feriados ativos (status = 0)
    - Admins (user_type_id 1 ou 2) podem ver e gerenciar todos os feriados
*/

-- Criar política SELECT específica para admins
DROP POLICY IF EXISTS "Admins can view all holidays including deleted" ON holidays;

CREATE POLICY "Admins can view all holidays including deleted"
  ON holidays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

-- Garantir que a política de UPDATE não tenha WITH CHECK restritivo
DROP POLICY IF EXISTS "Admins can update holidays" ON holidays;

CREATE POLICY "Admins can update holidays"
  ON holidays FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

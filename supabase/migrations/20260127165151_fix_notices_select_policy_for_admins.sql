/*
  # Corrigir política de leitura de avisos para administradores

  1. Problema
    - A política atual só permite ver avisos com status = 0 (ativos)
    - Administradores e gerentes precisam ver TODOS os avisos para gerenciá-los
    
  2. Solução
    - Criar política separada para admins/gerentes verem todos os avisos
    - Manter política restritiva para colaboradores normais
    
  3. Alterações
    - Remove política antiga de SELECT
    - Cria nova política para colaboradores (apenas avisos ativos relevantes)
    - Cria nova política para admins/gerentes (todos os avisos)
*/

-- Remover política antiga
DROP POLICY IF EXISTS "Employees can view relevant notices" ON notices;

-- Política para admins e gerentes verem TODOS os avisos
CREATE POLICY "Admins and managers can view all notices"
ON notices FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.auth_user_id = auth.uid()
    AND employees.user_type_id IN (1, 2)
  )
);

-- Política para colaboradores normais verem apenas avisos ativos destinados a eles
CREATE POLICY "Employees can view their active notices"
ON notices FOR SELECT
TO authenticated
USING (
  status = 0 AND
  NOT EXISTS (
    SELECT 1 FROM employees
    WHERE employees.auth_user_id = auth.uid()
    AND employees.user_type_id IN (1, 2)
  ) AND (
    is_for_all = true OR
    department_id IN (
      SELECT department_id FROM employees
      WHERE auth_user_id = auth.uid()
    ) OR
    employee_id IN (
      SELECT id FROM employees
      WHERE auth_user_id = auth.uid()
    )
  )
);

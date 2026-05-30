/*
  # Atualizar políticas RLS para avisos

  1. Políticas de Leitura
    - Colaboradores podem ver avisos destinados a eles (todos, seu setor ou específico para eles)
    
  2. Políticas de Escrita
    - Apenas admins e gerentes podem criar, atualizar e deletar avisos
    
  3. Segurança
    - Garante que cada colaborador veja apenas os avisos relevantes
*/

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Employees can view relevant notices" ON notices;
DROP POLICY IF EXISTS "Admins and managers can insert notices" ON notices;
DROP POLICY IF EXISTS "Admins and managers can update notices" ON notices;
DROP POLICY IF EXISTS "Admins and managers can delete notices" ON notices;

-- Política de visualização: colaboradores veem avisos destinados a eles
CREATE POLICY "Employees can view relevant notices"
ON notices FOR SELECT
TO authenticated
USING (
  status = 0 AND (
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

-- Política de inserção: apenas admins e gerentes
CREATE POLICY "Admins and managers can insert notices"
ON notices FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.auth_user_id = auth.uid()
    AND employees.user_type_id IN (1, 2)
  )
);

-- Política de atualização: apenas admins e gerentes
CREATE POLICY "Admins and managers can update notices"
ON notices FOR UPDATE
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

-- Política de exclusão: apenas admins e gerentes
CREATE POLICY "Admins and managers can delete notices"
ON notices FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.auth_user_id = auth.uid()
    AND employees.user_type_id IN (1, 2)
  )
);
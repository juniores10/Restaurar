/*
  # Corrigir politicas RLS para sector_productivity_uploads
  
  1. Problema
    - A politica atual usa uma subconsulta em sector_productivity_records
    - Isso cria dependencia circular quando usado com INNER JOIN
    - Funcionarios nao conseguem ver seus dados de produtividade
  
  2. Solucao
    - Simplificar a politica para permitir que usuarios autenticados vejam uploads
    - O controle de acesso real esta na tabela sector_productivity_records
    - Uploads nao contem dados sensiveis (apenas metadados)
  
  3. Alteracoes
    - Remove politicas antigas de SELECT para funcionarios
    - Adiciona nova politica simples para SELECT
*/

DROP POLICY IF EXISTS "Employees can view relevant sector productivity uploads" ON sector_productivity_uploads;
DROP POLICY IF EXISTS "Employees can view uploads containing their records" ON sector_productivity_uploads;

CREATE POLICY "Authenticated users can view sector productivity uploads"
  ON sector_productivity_uploads
  FOR SELECT
  TO authenticated
  USING (true);
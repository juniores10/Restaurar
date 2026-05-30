/*
  # Corrigir politicas RLS para productivity_sections
  
  1. Problema
    - Apenas admins podem visualizar productivity_sections
    - Funcionarios nao conseguem ver os titulos das secoes
    - Isso impede a exibicao correta dos dados de produtividade
  
  2. Solucao
    - Adicionar politica para permitir funcionarios verem secoes
    - Secoes nao contem dados sensiveis (apenas configuracao de exibicao)
*/

CREATE POLICY "Authenticated users can view productivity sections"
  ON productivity_sections
  FOR SELECT
  TO authenticated
  USING (true);
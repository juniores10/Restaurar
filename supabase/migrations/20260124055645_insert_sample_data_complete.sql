/*
  # Inserção de Dados de Exemplo

  ## Dados Inseridos
  
  1. **Companies** - Empresa exemplo
  2. **Locations** - Locais/filiais
  3. **Data Types** - Funções, Setores e Cargos
  4. **Employees** - Funcionários de exemplo
  
  Nota: Usa condições IF NOT EXISTS para evitar duplicação
*/

-- Inserir empresa exemplo
INSERT INTO companies (legal_name, trade_name, cnpj, email, phone, status)
VALUES 
  ('Empresa Exemplo LTDA', 'Exemplo Corp', '12.345.678/0001-90', 'contato@exemplo.com', '(11) 3333-4444', 0)
ON CONFLICT DO NOTHING;

-- Inserir locais
INSERT INTO locations (legal_name, trade_name, city, state, status)
VALUES 
  ('Sede Principal', 'Matriz', 'São Paulo', 'SP', 0),
  ('Filial Centro', 'Centro', 'São Paulo', 'SP', 0),
  ('Filial Sul', 'Sul', 'Porto Alegre', 'RS', 0)
ON CONFLICT DO NOTHING;

-- Inserir setores (type=2)
INSERT INTO data_types (type, description, short_description, status)
VALUES 
  (2, 'Administração', 'Admin', 0),
  (2, 'Recursos Humanos', 'RH', 0),
  (2, 'Tecnologia da Informação', 'TI', 0),
  (2, 'Financeiro', 'Fin', 0),
  (2, 'Operações', 'Oper', 0),
  (2, 'Comercial', 'Comerc', 0)
ON CONFLICT DO NOTHING;

-- Inserir cargos (type=3)
INSERT INTO data_types (type, description, short_description, status)
VALUES 
  (3, 'Gerente', 'Ger', 0),
  (3, 'Coordenador', 'Coord', 0),
  (3, 'Analista', 'Analist', 0),
  (3, 'Assistente', 'Assist', 0),
  (3, 'Auxiliar', 'Aux', 0),
  (3, 'Estagiário', 'Estag', 0)
ON CONFLICT DO NOTHING;

-- Inserir funções (type=1) vinculadas a setores
DO $$
DECLARE
  setor_ti uuid;
  setor_rh uuid;
  setor_admin uuid;
BEGIN
  -- Buscar IDs dos setores
  SELECT id INTO setor_ti FROM data_types WHERE type = 2 AND description = 'Tecnologia da Informação' LIMIT 1;
  SELECT id INTO setor_rh FROM data_types WHERE type = 2 AND description = 'Recursos Humanos' LIMIT 1;
  SELECT id INTO setor_admin FROM data_types WHERE type = 2 AND description = 'Administração' LIMIT 1;
  
  -- Inserir funções
  INSERT INTO data_types (type, description, short_description, related_code, status)
  VALUES 
    (1, 'Desenvolvedor Full Stack', 'Dev Full', setor_ti, 0),
    (1, 'Analista de Sistemas', 'Analist Sist', setor_ti, 0),
    (1, 'Suporte Técnico', 'Suporte', setor_ti, 0),
    (1, 'Recrutador', 'Recrut', setor_rh, 0),
    (1, 'Analista de RH', 'Analist RH', setor_rh, 0),
    (1, 'Assistente Administrativo', 'Assist Admin', setor_admin, 0)
  ON CONFLICT DO NOTHING;
END $$;
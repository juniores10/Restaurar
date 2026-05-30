/*
  # Inserir Dados de Exemplo Completos

  ## Dados Inseridos
  
  1. **Empresas**
     - Profsa Informática (empresa principal)
  
  2. **Locais**
     - Matriz São Paulo
     - Filial Campinas
  
  3. **Dados Genéricos (Funções, Setores, Cargos)**
     - Funções: Desenvolvedor, Analista, Suporte
     - Setores: TI, RH, Financeiro, Comercial
     - Cargos: Júnior, Pleno, Sênior, Gerente
  
  4. **Assuntos (Produtividade)**
     - Desenvolvimento de Software
     - Suporte Técnico
     - Atendimento ao Cliente
     - Manutenção de Sistemas
  
  5. **Tipos de Documentos**
     - RG, CPF, CNH, Comprovante de Residência
  
  6. **Funcionários de Exemplo**
     - Com dados completos incluindo horários de trabalho
*/

-- Inserir empresa
INSERT INTO companies (legal_name, trade_name, cnpj, email, phone, city, state, status)
VALUES 
  ('Profsa Informática Ltda', 'Profsa', '12.345.678/0001-90', 'contato@profsa.com.br', '(11) 3456-7890', 'São Paulo', 'SP', 0)
ON CONFLICT DO NOTHING;

-- Inserir locais
INSERT INTO locations (legal_name, trade_name, branch_type, city, state, phone, email, status)
VALUES 
  ('Profsa Matriz', 'Matriz SP', 'Matriz', 'São Paulo', 'SP', '(11) 3456-7890', 'matriz@profsa.com.br', 0),
  ('Profsa Filial Campinas', 'Filial Campinas', 'Filial', 'Campinas', 'SP', '(19) 3456-7891', 'campinas@profsa.com.br', 0)
ON CONFLICT DO NOTHING;

-- Inserir funções (type = 1)
INSERT INTO data_types (type, description, short_description, status)
VALUES 
  (1, 'Desenvolvedor Full Stack', 'Dev Full Stack', 0),
  (1, 'Analista de Sistemas', 'Analista', 0),
  (1, 'Suporte Técnico', 'Suporte', 0),
  (1, 'Gerente de Projetos', 'Gerente', 0)
ON CONFLICT DO NOTHING;

-- Inserir setores (type = 2)
INSERT INTO data_types (type, description, short_description, status)
VALUES 
  (2, 'Tecnologia da Informação', 'TI', 0),
  (2, 'Recursos Humanos', 'RH', 0),
  (2, 'Financeiro', 'FIN', 0),
  (2, 'Comercial', 'COM', 0),
  (2, 'Suporte ao Cliente', 'SUP', 0)
ON CONFLICT DO NOTHING;

-- Inserir cargos (type = 3)
INSERT INTO data_types (type, description, short_description, status)
VALUES 
  (3, 'Júnior', 'JR', 0),
  (3, 'Pleno', 'PL', 0),
  (3, 'Sênior', 'SR', 0),
  (3, 'Gerente', 'GER', 0),
  (3, 'Diretor', 'DIR', 0)
ON CONFLICT DO NOTHING;

-- Inserir assuntos para produtividade
INSERT INTO subjects (description, abbreviation, status)
VALUES 
  ('Desenvolvimento de Software', 'DEV', 0),
  ('Suporte Técnico', 'SUP', 0),
  ('Atendimento ao Cliente', 'ATC', 0),
  ('Manutenção de Sistemas', 'MAN', 0),
  ('Treinamento', 'TRE', 0),
  ('Documentação', 'DOC', 0)
ON CONFLICT DO NOTHING;

-- Inserir tipos de documentos
INSERT INTO document_types (description, abbreviation, status)
VALUES 
  ('Registro Geral (RG)', 'RG', 0),
  ('Cadastro de Pessoa Física (CPF)', 'CPF', 0),
  ('Carteira Nacional de Habilitação', 'CNH', 0),
  ('Comprovante de Residência', 'COMP.RES', 0),
  ('Certidão de Nascimento', 'NASC', 0),
  ('Título de Eleitor', 'TIT.ELE', 0),
  ('Carteira de Trabalho', 'CTPS', 0)
ON CONFLICT DO NOTHING;

-- Inserir funcionários de exemplo
DO $$
DECLARE
  loc_matriz_id uuid;
  loc_filial_id uuid;
  func_dev_id uuid;
  func_analista_id uuid;
  func_suporte_id uuid;
  setor_ti_id uuid;
  setor_rh_id uuid;
  cargo_jr_id uuid;
  cargo_pl_id uuid;
  cargo_sr_id uuid;
BEGIN
  -- Obter IDs dos dados inseridos
  SELECT id INTO loc_matriz_id FROM locations WHERE trade_name = 'Matriz SP' LIMIT 1;
  SELECT id INTO loc_filial_id FROM locations WHERE trade_name = 'Filial Campinas' LIMIT 1;
  SELECT id INTO func_dev_id FROM data_types WHERE type = 1 AND description = 'Desenvolvedor Full Stack' LIMIT 1;
  SELECT id INTO func_analista_id FROM data_types WHERE type = 1 AND description = 'Analista de Sistemas' LIMIT 1;
  SELECT id INTO func_suporte_id FROM data_types WHERE type = 1 AND description = 'Suporte Técnico' LIMIT 1;
  SELECT id INTO setor_ti_id FROM data_types WHERE type = 2 AND description = 'Tecnologia da Informação' LIMIT 1;
  SELECT id INTO setor_rh_id FROM data_types WHERE type = 2 AND description = 'Recursos Humanos' LIMIT 1;
  SELECT id INTO cargo_jr_id FROM data_types WHERE type = 3 AND description = 'Júnior' LIMIT 1;
  SELECT id INTO cargo_pl_id FROM data_types WHERE type = 3 AND description = 'Pleno' LIMIT 1;
  SELECT id INTO cargo_sr_id FROM data_types WHERE type = 3 AND description = 'Sênior' LIMIT 1;

  -- Inserir funcionários
  INSERT INTO employees (
    name, registration_number, cpf, password, birth_date, email,
    monthly_workload, workload_monday, workload_tuesday, workload_wednesday, 
    workload_thursday, workload_friday,
    schedule_monday, schedule_tuesday, schedule_wednesday, schedule_thursday, schedule_friday,
    location_id, department_id, position_id, role_id, status
  )
  VALUES 
    (
      'João Silva', 'MAT001', '123.456.789-00', 'senha123', '1990-03-15', 'joao.silva@profsa.com.br',
      220, 8, 8, 8, 8, 8,
      '08:00-12:00/13:00-17:00', '08:00-12:00/13:00-17:00', '08:00-12:00/13:00-17:00', 
      '08:00-12:00/13:00-17:00', '08:00-12:00/13:00-17:00',
      loc_matriz_id, setor_ti_id, cargo_sr_id, func_dev_id, 0
    ),
    (
      'Maria Santos', 'MAT002', '987.654.321-00', 'senha123', '1992-07-20', 'maria.santos@profsa.com.br',
      220, 8, 8, 8, 8, 8,
      '09:00-13:00/14:00-18:00', '09:00-13:00/14:00-18:00', '09:00-13:00/14:00-18:00',
      '09:00-13:00/14:00-18:00', '09:00-13:00/14:00-18:00',
      loc_matriz_id, setor_ti_id, cargo_pl_id, func_analista_id, 0
    ),
    (
      'Pedro Oliveira', 'MAT003', '456.789.123-00', 'senha123', '1995-11-10', 'pedro.oliveira@profsa.com.br',
      220, 8, 8, 8, 8, 8,
      '08:00-12:00/13:00-17:00', '08:00-12:00/13:00-17:00', '08:00-12:00/13:00-17:00',
      '08:00-12:00/13:00-17:00', '08:00-12:00/13:00-17:00',
      loc_filial_id, setor_ti_id, cargo_jr_id, func_suporte_id, 0
    ),
    (
      'Ana Costa', 'MAT004', '789.123.456-00', 'senha123', '1988-01-25', 'ana.costa@profsa.com.br',
      220, 8, 8, 8, 8, 8,
      '08:00-12:00/13:00-17:00', '08:00-12:00/13:00-17:00', '08:00-12:00/13:00-17:00',
      '08:00-12:00/13:00-17:00', '08:00-12:00/13:00-17:00',
      loc_matriz_id, setor_rh_id, cargo_pl_id, func_analista_id, 0
    )
  ON CONFLICT (cpf) DO NOTHING;
END $$;

-- Inserir alguns veículos de exemplo
DO $$
DECLARE
  emp_joao_id uuid;
  emp_maria_id uuid;
BEGIN
  SELECT id INTO emp_joao_id FROM employees WHERE cpf = '123.456.789-00' LIMIT 1;
  SELECT id INTO emp_maria_id FROM employees WHERE cpf = '987.654.321-00' LIMIT 1;

  INSERT INTO fleet (
    employee_id, vehicle_description, plate, renavam, registration_date, 
    kilometers_driven, status
  )
  VALUES 
    (emp_joao_id, 'Fiat Uno 2020', 'ABC-1234', '12345678901', CURRENT_DATE, 15000, 0),
    (emp_maria_id, 'Honda Civic 2021', 'XYZ-9876', '98765432109', CURRENT_DATE, 8000, 0)
  ON CONFLICT DO NOTHING;
END $$;

-- Inserir avisos de exemplo
INSERT INTO notices (title, description, is_for_all, status)
VALUES 
  ('Bem-vindo ao Sistema PegaNet', 'Este é o novo sistema de gerenciamento de colaboradores da Profsa. Explore as funcionalidades e aproveite!', true, 0),
  ('Reunião Mensal', 'Lembrete: Reunião mensal de alinhamento será na próxima sexta-feira às 14h.', true, 0),
  ('Atualização de Sistema', 'O sistema passará por manutenção no próximo domingo das 8h às 12h.', true, 0)
ON CONFLICT DO NOTHING;

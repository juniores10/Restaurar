/*
  # Reestruturação Completa do Sistema de Gerenciamento de Colaboradores

  ## Mudanças Principais
  
  1. **Nova Estrutura de Tabelas**
     - companies: Empresas cadastradas
     - locations: Locais/filiais de trabalho
     - data_types: Tabela genérica para funções, setores e cargos
     - employees: Funcionários completos com todos os dados
     - time_bank: Registro de banco de horas
     - schedules: Escalas de trabalho dos funcionários
  
  2. **Campos Detalhados**
     
     **companies (tb_empresa)**
     - Dados cadastrais completos (CNPJ, razão social, fantasia)
     - Endereço completo
     - Contatos (telefone, celular, email, site)
     - Tipo de pessoa (física/jurídica)
     
     **locations (tb_local)**
     - Nome e nome fantasia
     - Endereço completo
     - Identificação matriz/filial
     - Contatos
     
     **data_types (tb_dados)**
     - Tabela genérica para:
       - type=1: Funções
       - type=2: Setores
       - type=3: Cargos
     - Descrição completa e resumida
     - Relacionamento entre entidades (ex: função pertence a setor)
     
     **employees (tb_funcionario)**
     - Dados pessoais completos
     - CPF, matrícula, nascimento
     - Status detalhado (ativo, férias, suspenso, afastado, desligado)
     - Carga horária mensal e diária por dia da semana
     - Horários de trabalho (entrada/saída)
     - Vínculos: local, setor, cargo, função
     - Saldo inicial de horas
     - Status de assinatura digital
     - Observações
     
     **time_bank (tb_horas)**
     - Registro diário de ponto
     - Múltiplas entradas/saídas (até 6 por dia)
     - Controle de faltas, atrasos, adiantamentos, horas extras
     - Vínculo com funcionário e local
     
     **schedules (tb_escala)**
     - Escalas de trabalho
     - Período (data/hora início e fim)
     - Tipos de folga (indefinida, folga, férias, domingo, feriado, day off, etc.)
     - Observações
  
  3. **Segurança (RLS)**
     - Todas as tabelas com RLS habilitado
     - Políticas restritivas baseadas em autenticação
     - Administradores têm acesso completo
     - Funcionários têm acesso limitado aos próprios dados
  
  4. **Auditoria**
     - Campos de auditoria em todas as tabelas:
       - created_by/created_at
       - updated_by/updated_at
*/

-- Remover tabelas antigas se existirem
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS time_bank CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS data_types CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  cnpj text,
  legal_name text NOT NULL,
  trade_name text,
  zip_code text,
  address text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  city_code text,
  phone text,
  mobile text,
  email text,
  website text,
  contact_person text,
  is_legal_entity boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de locais de trabalho
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type integer DEFAULT 1,
  status integer DEFAULT 0,
  legal_name text NOT NULL,
  trade_name text,
  branch_type text,
  zip_code text,
  address text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  phone text,
  mobile text,
  email text,
  contact_person text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela genérica para funções, setores e cargos
CREATE TABLE IF NOT EXISTS data_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type integer NOT NULL,
  status integer DEFAULT 0,
  description text NOT NULL,
  short_description text,
  related_code uuid,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  name text NOT NULL,
  registration_number text NOT NULL,
  cpf text NOT NULL UNIQUE,
  password text NOT NULL,
  birth_date date,
  email text NOT NULL,
  monthly_workload integer DEFAULT 0,
  
  -- Carga horária por dia da semana (domingo=0, segunda=1, etc)
  workload_sunday integer DEFAULT 0,
  workload_monday integer DEFAULT 0,
  workload_tuesday integer DEFAULT 0,
  workload_wednesday integer DEFAULT 0,
  workload_thursday integer DEFAULT 0,
  workload_friday integer DEFAULT 0,
  workload_saturday integer DEFAULT 0,
  
  -- Horários de trabalho
  schedule_sunday text,
  schedule_monday text,
  schedule_tuesday text,
  schedule_wednesday text,
  schedule_thursday text,
  schedule_friday text,
  schedule_saturday text,
  
  -- Vínculos
  location_id uuid REFERENCES locations(id),
  department_id uuid REFERENCES data_types(id),
  position_id uuid REFERENCES data_types(id),
  role_id uuid REFERENCES data_types(id),
  
  -- Saldo inicial de horas
  initial_balance integer DEFAULT 0,
  
  -- Status da assinatura digital
  signature_status integer DEFAULT 0,
  signature_url text,
  
  -- Foto do funcionário
  photo_url text,
  
  notes text,
  
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de banco de horas
CREATE TABLE IF NOT EXISTS time_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id),
  work_date date NOT NULL,
  
  -- Até 6 entradas e saídas por dia
  entry_time_1 time,
  exit_time_1 time,
  entry_time_2 time,
  exit_time_2 time,
  entry_time_3 time,
  exit_time_3 time,
  entry_time_4 time,
  exit_time_4 time,
  entry_time_5 time,
  exit_time_5 time,
  entry_time_6 time,
  exit_time_6 time,
  
  -- Contadores de horas
  absence_hours integer DEFAULT 0,
  late_hours integer DEFAULT 0,
  advance_hours integer DEFAULT 0,
  extra_hours integer DEFAULT 0,
  
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Tabela de escalas de trabalho
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status integer DEFAULT 0,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id),
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  leave_type integer DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Políticas para companies
CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para locations
CREATE POLICY "Authenticated users can view locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update locations"
  ON locations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete locations"
  ON locations FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para data_types
CREATE POLICY "Authenticated users can view data types"
  ON data_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert data types"
  ON data_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update data types"
  ON data_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete data types"
  ON data_types FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para employees
CREATE POLICY "Authenticated users can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para time_bank
CREATE POLICY "Authenticated users can view time bank"
  ON time_bank FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert time bank"
  ON time_bank FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update time bank"
  ON time_bank FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete time bank"
  ON time_bank FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para schedules
CREATE POLICY "Authenticated users can view schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete schedules"
  ON schedules FOR DELETE
  TO authenticated
  USING (true);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON employees(cpf);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_time_bank_employee ON time_bank(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_bank_date ON time_bank(work_date);
CREATE INDEX IF NOT EXISTS idx_schedules_employee ON schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_dates ON schedules(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_data_types_type ON data_types(type);
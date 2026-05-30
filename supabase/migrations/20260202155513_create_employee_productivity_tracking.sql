/*
  # Sistema de Acompanhamento de Produtividade dos Colaboradores

  ## Descrição
  Cria tabelas para rastrear metas de produtividade e realizações diárias dos colaboradores,
  permitindo análises de planejado vs realizado, diferenças e aderência.

  ## Novas Tabelas
  
  ### `employee_productivity_goals`
  Armazena as metas mensais de produtividade para cada colaborador
  - `id` (uuid, chave primária)
  - `employee_id` (uuid, referência a employees)
  - `month` (integer, 1-12)
  - `year` (integer)
  - `planned_value` (numeric, meta planejada mensal)
  - `description` (text, descrição opcional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `employee_productivity_daily`
  Registra a produtividade realizada diariamente por cada colaborador
  - `id` (uuid, chave primária)
  - `employee_id` (uuid, referência a employees)
  - `work_date` (date, data do trabalho)
  - `realized_value` (numeric, valor realizado no dia)
  - `notes` (text, observações opcionais)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Segurança
  - RLS habilitado em ambas as tabelas
  - Administradores podem gerenciar todos os registros
  - Colaboradores podem visualizar apenas seus próprios registros
*/

-- Tabela de metas mensais de produtividade
CREATE TABLE IF NOT EXISTS employee_productivity_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  planned_value numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- Tabela de produtividade diária realizada
CREATE TABLE IF NOT EXISTS employee_productivity_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  realized_value numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, work_date)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_productivity_goals_employee ON employee_productivity_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_productivity_goals_period ON employee_productivity_goals(year, month);
CREATE INDEX IF NOT EXISTS idx_productivity_daily_employee ON employee_productivity_daily(employee_id);
CREATE INDEX IF NOT EXISTS idx_productivity_daily_date ON employee_productivity_daily(work_date);

-- Habilitar RLS
ALTER TABLE employee_productivity_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_productivity_daily ENABLE ROW LEVEL SECURITY;

-- Políticas para employee_productivity_goals
CREATE POLICY "Administradores podem visualizar todas as metas"
  ON employee_productivity_goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name = 'Administrador'
      )
    )
  );

CREATE POLICY "Colaboradores podem visualizar suas próprias metas"
  ON employee_productivity_goals FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Administradores podem inserir metas"
  ON employee_productivity_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name = 'Administrador'
      )
    )
  );

CREATE POLICY "Administradores podem atualizar metas"
  ON employee_productivity_goals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name = 'Administrador'
      )
    )
  );

CREATE POLICY "Administradores podem deletar metas"
  ON employee_productivity_goals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name = 'Administrador'
      )
    )
  );

-- Políticas para employee_productivity_daily
CREATE POLICY "Administradores podem visualizar todos os registros diários"
  ON employee_productivity_daily FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name = 'Administrador'
      )
    )
  );

CREATE POLICY "Colaboradores podem visualizar seus próprios registros diários"
  ON employee_productivity_daily FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Administradores podem inserir registros diários"
  ON employee_productivity_daily FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name = 'Administrador'
      )
    )
  );

CREATE POLICY "Administradores podem atualizar registros diários"
  ON employee_productivity_daily FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name = 'Administrador'
      )
    )
  );

CREATE POLICY "Administradores podem deletar registros diários"
  ON employee_productivity_daily FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
      AND employees.user_type_id IN (
        SELECT id FROM user_types WHERE name = 'Administrador'
      )
    )
  );

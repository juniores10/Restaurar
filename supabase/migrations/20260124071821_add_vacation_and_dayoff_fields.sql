/*
  # Adicionar campos de ferias e folga no cadastro de colaboradores

  ## Descricao
  Esta migracao adiciona campos essenciais para controle de ferias e folgas dos colaboradores,
  permitindo calcular quantos dias faltam para a proxima folga e ferias.

  ## Novos Campos na Tabela employees
  - `hire_date` (date): Data de admissao do colaborador
  - `next_vacation_start` (date): Data de inicio das proximas ferias
  - `next_vacation_end` (date): Data de fim das proximas ferias
  - `vacation_days_entitled` (integer): Dias de ferias a que tem direito (padrao 30)
  - `last_vacation_date` (date): Data da ultima vez que tirou ferias
  - `dayoff_frequency_days` (integer): Frequencia de folga em dias (ex: a cada 7 dias)
  - `next_dayoff_date` (date): Data da proxima folga programada

  ## Seguranca
  - Campos adicionados seguem as politicas RLS existentes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'hire_date'
  ) THEN
    ALTER TABLE employees ADD COLUMN hire_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'next_vacation_start'
  ) THEN
    ALTER TABLE employees ADD COLUMN next_vacation_start date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'next_vacation_end'
  ) THEN
    ALTER TABLE employees ADD COLUMN next_vacation_end date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'vacation_days_entitled'
  ) THEN
    ALTER TABLE employees ADD COLUMN vacation_days_entitled integer DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'last_vacation_date'
  ) THEN
    ALTER TABLE employees ADD COLUMN last_vacation_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'dayoff_frequency_days'
  ) THEN
    ALTER TABLE employees ADD COLUMN dayoff_frequency_days integer DEFAULT 7;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'next_dayoff_date'
  ) THEN
    ALTER TABLE employees ADD COLUMN next_dayoff_date date;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employees_next_vacation ON employees(next_vacation_start);
CREATE INDEX IF NOT EXISTS idx_employees_next_dayoff ON employees(next_dayoff_date);
CREATE INDEX IF NOT EXISTS idx_employees_birth_date ON employees(birth_date);

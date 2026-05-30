/*
  # Adicionar vinculação entre employees e auth.users

  1. Alterações
    - Adiciona coluna `auth_user_id` na tabela `employees` para vincular com `auth.users`
    - Adiciona constraint UNIQUE para garantir que cada usuário auth tenha apenas um employee
    - Adiciona foreign key para manter integridade referencial
    
  2. Segurança
    - Mantém RLS existente
*/

-- Adiciona coluna auth_user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) UNIQUE;
  END IF;
END $$;

-- Adiciona coluna user_type_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'user_type_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN user_type_id integer REFERENCES user_types(id) DEFAULT 3;
  END IF;
END $$;
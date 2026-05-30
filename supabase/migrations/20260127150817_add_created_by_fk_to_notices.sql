/*
  # Adicionar foreign key para created_by na tabela notices

  1. Alteracoes
    - Adiciona foreign key de `created_by` para a tabela `employees`
    - Permite que o Supabase reconheca o relacionamento nas queries
*/

-- Adicionar foreign key para created_by referenciando employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notices_created_by_fkey'
    AND table_name = 'notices'
  ) THEN
    ALTER TABLE notices 
    ADD CONSTRAINT notices_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES employees(id);
  END IF;
END $$;

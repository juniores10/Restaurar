/*
  # Add Lider user type

  1. New Data
    - Adds 'Lider' user type (id=5) to the `user_types` table
    - Description: Acesso de lideranca com permissoes de administrador
  
  2. Notes
    - Lider will have the same system access as Administrador
    - Uses IF NOT EXISTS check to prevent duplicate entries
*/

INSERT INTO user_types (id, name, description)
VALUES (5, 'Líder', 'Acesso de lideranca com permissoes de administrador')
ON CONFLICT (id) DO NOTHING;

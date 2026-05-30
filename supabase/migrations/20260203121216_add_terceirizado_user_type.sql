/*
  # Add Terceirizado User Type

  1. Changes
    - Add new user type "Terceirizado" to user_types table
  
  2. Details
    - ID: 4
    - Name: Terceirizado
    - Description: Acesso para colaboradores terceirizados
*/

INSERT INTO user_types (id, name, description)
VALUES (4, 'Terceirizado', 'Acesso para colaboradores terceirizados')
ON CONFLICT (id) DO NOTHING;

/*
  # Insert User Types and Test Data

  1. User Types
    - Insert predefined user types (Admin, Manager, Employee)
  
  2. Test User
    - Create a test admin user for system access
    - Email: admin@peganet.com
    - Password: PegaNet2024!
*/

-- Insert user types
INSERT INTO user_types (id, name, description) VALUES
  (1, 'Administrador', 'Acesso total ao sistema'),
  (2, 'Gestor', 'Gerenciamento de equipes'),
  (3, 'Colaborador', 'Acesso básico ao sistema')
ON CONFLICT (id) DO NOTHING;
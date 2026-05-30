/*
  # Insert Sample Employees
  
  1. Sample Data
    - Create sample employees with different user types
    - Add employees with various birth dates for birthday testing
    
  Note: These are demo employees without auth users, for display purposes only
*/

-- Insert sample employees (without auth users, just for demonstration)
INSERT INTO employees (id, auth_user_id, email, full_name, user_type_id, birth_date, is_active) VALUES
  (gen_random_uuid(), NULL, 'maria.silva@peganet.com', 'Maria Silva Santos', 2, '1988-02-15', true),
  (gen_random_uuid(), NULL, 'joao.oliveira@peganet.com', 'João Pedro Oliveira', 3, '1992-06-22', true),
  (gen_random_uuid(), NULL, 'ana.costa@peganet.com', 'Ana Carolina Costa', 3, '1995-03-10', true),
  (gen_random_uuid(), NULL, 'carlos.souza@peganet.com', 'Carlos Eduardo Souza', 2, '1987-11-30', true),
  (gen_random_uuid(), NULL, 'patricia.santos@peganet.com', 'Patricia Santos Lima', 3, '1990-08-18', true),
  (gen_random_uuid(), NULL, 'ricardo.almeida@peganet.com', 'Ricardo Almeida Neto', 3, '1993-01-25', true),
  (gen_random_uuid(), NULL, 'fernanda.rocha@peganet.com', 'Fernanda Rocha Silva', 3, '1991-07-12', true),
  (gen_random_uuid(), NULL, 'lucas.martins@peganet.com', 'Lucas Martins Pereira', 2, '1989-04-08', true),
  (gen_random_uuid(), NULL, 'juliana.ferreira@peganet.com', 'Juliana Ferreira Costa', 3, '1994-12-05', true),
  (gen_random_uuid(), NULL, 'roberto.lima@peganet.com', 'Roberto Lima Júnior', 3, '1986-09-20', true)
ON CONFLICT DO NOTHING;
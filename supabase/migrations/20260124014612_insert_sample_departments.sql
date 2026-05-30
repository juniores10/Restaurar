/*
  # Insert sample departments

  1. Data
    - Add 5 sample departments for testing
*/

INSERT INTO departments (name, description) VALUES
  ('Vendas', 'Departamento de Vendas'),
  ('Recursos Humanos', 'Departamento de RH'),
  ('Financeiro', 'Departamento Financeiro'),
  ('Tecnologia', 'Departamento de TI'),
  ('Marketing', 'Departamento de Marketing')
ON CONFLICT (name) DO NOTHING;

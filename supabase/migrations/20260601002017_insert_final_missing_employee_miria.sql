/*
  # Insert Final Missing Employee

  MIRIA DE FATIMA ANISIO SANTOS (CPF: 21138822728) was the last employee
  present in the CSV but not yet in the database.
*/

INSERT INTO employees (name, cpf, rg, ctps, registration_number, password, status, location_id, department_id, position_id, sector_id, area, email, phone, phone2, address, opt_vt, is_active, birth_date)
VALUES (
  'MIRIA DE FATIMA ANISIO SANTOS', '21138822728', '338546088', '2113882-2728', '782', 'colaborador', 0,
  'd22ba4a7-514d-42f6-8b7b-0993003e0855',
  '777abebf-e841-4800-9b3b-5498a39e5a32',
  'df73f3f7-966a-4c36-ace4-cec380dee70b',
  'ec3761f2-59a9-44ba-b696-e48a2ab24f5d',
  'PRODUÇÃO', 'miriadefatima8@gmail.com', '24993088234', '24993088234',
  'R A, 385 CS 1  JOAO BONITO VALENCA-RJ 27.600-000', false, true, '2003-05-13'
)
ON CONFLICT (cpf) DO NOTHING;

/*
  # Normalize area field values to match dropdown options

  The area field was stored in ALL CAPS (PRODUÇÃO, ADMINISTRATIVO, LOGISTICA, OBRA)
  but the dropdown options use mixed case (Produção, Administrativo, Logística, Obra).
  This migration normalizes all values to match the dropdown exactly.
*/

UPDATE employees SET area = 'Produção'      WHERE area IN ('PRODUÇÃO', 'Produção');
UPDATE employees SET area = 'Administrativo' WHERE area = 'ADMINISTRATIVO';
UPDATE employees SET area = 'Logística'      WHERE area IN ('LOGISTICA', 'Logística');
UPDATE employees SET area = 'Obra'           WHERE area = 'OBRA';

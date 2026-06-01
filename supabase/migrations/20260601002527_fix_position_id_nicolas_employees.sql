/*
  # Fix position_id for 2 employees

  The position_id was previously swapped with sector_id.
  Now correcting both to their proper values.
*/

UPDATE employees 
SET position_id = '52a1e7a9-d940-4ff1-ac42-713415d7705a'
WHERE cpf = '15869321794';

UPDATE employees 
SET position_id = '6979c008-3f28-4efe-ab50-def42fb9e07e'
WHERE cpf = '15062100747';

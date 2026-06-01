/*
  # Fix sector_id for 2 employees with wrong sector reference

  NICOLAS RICARDO FERREIRA DOS SANTOS: sector was pointing to a position (type=3)
  instead of Marketing sector (type=8).
  
  NICOLAS TOLEDO CARVALHO: sector was pointing to a position (type=3)
  instead of Vendas sector (type=8).
*/

UPDATE employees 
SET sector_id = 'db5a571b-ea04-48d7-9140-ff77dbc5452c'
WHERE cpf = '15869321794';

UPDATE employees 
SET sector_id = 'edb90d64-9d3e-4574-b94b-001c26080c6e'
WHERE cpf = '15062100747';

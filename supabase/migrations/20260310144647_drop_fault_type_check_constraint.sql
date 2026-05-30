/*
  # Remove fault_type check constraint from maintenance_orders

  The fault_type field previously had a hard-coded CHECK constraint limiting
  values to 'Elétrica', 'Operacional', and 'Equipamento'. Since fault types
  are now managed dynamically via the maintenance_occurrences table, this
  constraint must be removed to allow any custom fault type value.
*/

ALTER TABLE maintenance_orders DROP CONSTRAINT IF EXISTS maintenance_orders_fault_type_check;

/*
  # Add inactivation reason field to maintenance_equipment

  ## Changes
  - Adds `inactivation_reason` (Motivo da Inativacao) text column to maintenance_equipment
  - This field is optional and should be filled when marking equipment as inactive
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_equipment' AND column_name = 'inactivation_reason'
  ) THEN
    ALTER TABLE maintenance_equipment ADD COLUMN inactivation_reason text DEFAULT '';
  END IF;
END $$;

/*
  # Add hourly cost to maintenance equipment

  Adds a `hourly_cost` column (numeric) to the `maintenance_equipment` table
  to store the cost per hour of each piece of equipment. Defaults to 0.
*/

ALTER TABLE maintenance_equipment
  ADD COLUMN IF NOT EXISTS hourly_cost numeric(12, 2) NOT NULL DEFAULT 0;

/*
  # Add many-to-many relationship between maintenance_materials and maintenance_equipment

  ## Summary
  Replaces the single equipment_id FK on maintenance_materials with a junction table
  so that one material can be linked to multiple pieces of equipment.

  ## Changes
  1. New Table: `maintenance_material_equipment`
     - `id` (uuid, primary key)
     - `material_id` (uuid, FK → maintenance_materials)
     - `equipment_id` (uuid, FK → maintenance_equipment)
     - unique constraint on (material_id, equipment_id)
  2. Migrates existing equipment_id data into the new junction table
  3. Keeps old equipment_id column intact (no data loss)
  4. RLS enabled with policies for authenticated users

  ## Notes
  - Old equipment_id column is NOT dropped to preserve backwards compatibility
  - The UI will use the junction table going forward
*/

CREATE TABLE IF NOT EXISTS maintenance_material_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES maintenance_materials(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES maintenance_equipment(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (material_id, equipment_id)
);

ALTER TABLE maintenance_material_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view material equipment links"
  ON maintenance_material_equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert material equipment links"
  ON maintenance_material_equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete material equipment links"
  ON maintenance_material_equipment FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO maintenance_material_equipment (material_id, equipment_id)
SELECT id, equipment_id
FROM maintenance_materials
WHERE equipment_id IS NOT NULL
ON CONFLICT (material_id, equipment_id) DO NOTHING;

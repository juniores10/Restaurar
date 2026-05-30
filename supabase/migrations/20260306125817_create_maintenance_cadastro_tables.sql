/*
  # Maintenance Cadastro Tables

  Creates 6 supporting tables used as lookup/reference data for the Factory Maintenance module.
  These are managed by admins in the Cadastro section and used as dropdown options throughout the system.

  1. New Tables
    - `maintenance_equipment` - Registered equipment/machines (name, tag_code, location_id, status)
    - `maintenance_occurrences` - Occurrence/stoppage types (name, description, status)
    - `maintenance_materials` - Materials, parts, and misc items (name, unit, status)
    - `maintenance_technicians` - Registered maintenance technicians (name, specialty_id, status)
    - `maintenance_specialties` - Technical specialties/skills (name, description, status)
    - `maintenance_locations` - Factory locations/sectors for maintenance (name, description, status)

  2. Security
    - RLS enabled on all tables
    - Authenticated users can SELECT all rows
    - Only admins (user_type_id = 1) can INSERT, UPDATE, DELETE
*/

-- Maintenance Specialties (referenced by technicians, so create first)
CREATE TABLE IF NOT EXISTS maintenance_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance specialties"
  ON maintenance_specialties FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert maintenance specialties"
  ON maintenance_specialties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1
    )
  );

CREATE POLICY "Admins can update maintenance specialties"
  ON maintenance_specialties FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can delete maintenance specialties"
  ON maintenance_specialties FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Locations
CREATE TABLE IF NOT EXISTS maintenance_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance locations"
  ON maintenance_locations FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert maintenance locations"
  ON maintenance_locations FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can update maintenance locations"
  ON maintenance_locations FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can delete maintenance locations"
  ON maintenance_locations FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Equipment
CREATE TABLE IF NOT EXISTS maintenance_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tag_code text DEFAULT '',
  location_id uuid REFERENCES maintenance_locations(id) ON DELETE SET NULL,
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance equipment"
  ON maintenance_equipment FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert maintenance equipment"
  ON maintenance_equipment FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can update maintenance equipment"
  ON maintenance_equipment FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can delete maintenance equipment"
  ON maintenance_equipment FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Occurrences (stoppage types)
CREATE TABLE IF NOT EXISTS maintenance_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance occurrences"
  ON maintenance_occurrences FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert maintenance occurrences"
  ON maintenance_occurrences FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can update maintenance occurrences"
  ON maintenance_occurrences FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can delete maintenance occurrences"
  ON maintenance_occurrences FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Materials
CREATE TABLE IF NOT EXISTS maintenance_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text DEFAULT 'un',
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance materials"
  ON maintenance_materials FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert maintenance materials"
  ON maintenance_materials FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can update maintenance materials"
  ON maintenance_materials FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can delete maintenance materials"
  ON maintenance_materials FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Maintenance Technicians
CREATE TABLE IF NOT EXISTS maintenance_technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty_id uuid REFERENCES maintenance_specialties(id) ON DELETE SET NULL,
  status integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance technicians"
  ON maintenance_technicians FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert maintenance technicians"
  ON maintenance_technicians FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can update maintenance technicians"
  ON maintenance_technicians FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

CREATE POLICY "Admins can delete maintenance technicians"
  ON maintenance_technicians FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.user_type_id = 1));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_location ON maintenance_equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_technicians_specialty ON maintenance_technicians(specialty_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_status ON maintenance_equipment(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_technicians_status ON maintenance_technicians(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_locations_status ON maintenance_locations(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_specialties_status ON maintenance_specialties(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_status ON maintenance_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_materials_status ON maintenance_materials(status);

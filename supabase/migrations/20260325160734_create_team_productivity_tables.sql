/*
  # Create Team Productivity Tables

  ## Summary
  Creates a productivity tracking system where values are entered per Team (not per individual employee).
  This mirrors the sector_productivity system but uses teams as the unit of measurement.

  ## New Tables

  ### team_productivity_uploads
  - Stores metadata for each productivity data entry session (upload/manual entry)
  - Links to a team and reference month
  - Tracks who created the entry and description

  ### team_productivity_sections
  - Defines sub-tables/sections within each upload (e.g., "Planejado", "Realizado")
  - Configurable display options (show totals, etc.)

  ### team_productivity_records
  - Individual daily productivity records keyed by team + subject + date
  - Supports numeric values and text categories

  ## Security
  - RLS enabled on all tables
  - Admins (Administrador, Gestor, Lider) can manage data
  - All authenticated users can view data
*/

-- Table for team productivity uploads metadata
CREATE TABLE IF NOT EXISTS team_productivity_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  reference_month text NOT NULL,
  description text,
  upload_date timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table for sections within each upload
CREATE TABLE IF NOT EXISTS team_productivity_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES team_productivity_uploads(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  section_key text NOT NULL,
  display_order integer DEFAULT 0,
  has_subject boolean DEFAULT false,
  show_day_total boolean DEFAULT true,
  input_mode text DEFAULT 'manual',
  status integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table for individual daily records (per team/section/subject/date)
CREATE TABLE IF NOT EXISTS team_productivity_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES team_productivity_uploads(id) ON DELETE CASCADE NOT NULL,
  section_id uuid REFERENCES team_productivity_sections(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  work_date date NOT NULL,
  points numeric,
  subject text,
  section_type text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_prod_uploads_team ON team_productivity_uploads(team_id);
CREATE INDEX IF NOT EXISTS idx_team_prod_uploads_month ON team_productivity_uploads(reference_month);
CREATE INDEX IF NOT EXISTS idx_team_prod_sections_upload ON team_productivity_sections(upload_id);
CREATE INDEX IF NOT EXISTS idx_team_prod_records_upload ON team_productivity_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_team_prod_records_team ON team_productivity_records(team_id);
CREATE INDEX IF NOT EXISTS idx_team_prod_records_date ON team_productivity_records(work_date);
CREATE INDEX IF NOT EXISTS idx_team_prod_records_section ON team_productivity_records(section_type);

-- Enable RLS
ALTER TABLE team_productivity_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_productivity_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_productivity_records ENABLE ROW LEVEL SECURITY;

-- Policies for team_productivity_uploads
CREATE POLICY "Admins can manage team productivity uploads"
  ON team_productivity_uploads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  );

CREATE POLICY "Admins can update team productivity uploads"
  ON team_productivity_uploads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  );

CREATE POLICY "Admins can delete team productivity uploads"
  ON team_productivity_uploads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  );

CREATE POLICY "All authenticated users can view team productivity uploads"
  ON team_productivity_uploads FOR SELECT
  TO authenticated
  USING (true);

-- Policies for team_productivity_sections
CREATE POLICY "Admins can manage team productivity sections"
  ON team_productivity_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  );

CREATE POLICY "Admins can update team productivity sections"
  ON team_productivity_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  );

CREATE POLICY "Admins can delete team productivity sections"
  ON team_productivity_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  );

CREATE POLICY "All authenticated users can view team productivity sections"
  ON team_productivity_sections FOR SELECT
  TO authenticated
  USING (true);

-- Policies for team_productivity_records
CREATE POLICY "Admins can manage team productivity records"
  ON team_productivity_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  );

CREATE POLICY "Admins can update team productivity records"
  ON team_productivity_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  );

CREATE POLICY "Admins can delete team productivity records"
  ON team_productivity_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN user_types ut ON e.user_type_id = ut.id
      WHERE e.auth_user_id = auth.uid()
      AND ut.name IN ('Administrador', 'Gestor', 'Lider')
    )
  );

CREATE POLICY "All authenticated users can view team productivity records"
  ON team_productivity_records FOR SELECT
  TO authenticated
  USING (true);

/*
  # Create System Settings and Company Logo Storage

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `company_logo_url` (text, nullable) - URL to the company logo in storage
      - `updated_at` (timestamptz) - Last update timestamp
      - `updated_by` (uuid) - Reference to employee who updated
  
  2. Storage
    - Create `company-assets` bucket for storing company logo
    - Public read access for login screen
    - Only admins/managers can upload
  
  3. Security
    - Enable RLS on `system_settings` table
    - Everyone can read settings (for login screen)
    - Only admins and managers can update settings
*/

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_logo_url text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES employees(id)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read system settings (needed for login screen)
CREATE POLICY "Anyone can view system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins and managers can update
CREATE POLICY "Admins can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

-- Only admins and managers can insert
CREATE POLICY "Admins can insert system settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

-- Insert default settings row
INSERT INTO system_settings (id, company_logo_url)
VALUES ('00000000-0000-0000-0000-000000000001', NULL)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company-assets bucket
-- Everyone can view (public read for login screen)
CREATE POLICY "Public can view company assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-assets');

-- Only admins and managers can upload
CREATE POLICY "Admins can upload company assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-assets' AND
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

-- Only admins and managers can update
CREATE POLICY "Admins can update company assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-assets' AND
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  )
  WITH CHECK (
    bucket_id = 'company-assets' AND
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

-- Only admins and managers can delete
CREATE POLICY "Admins can delete company assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-assets' AND
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.user_type_id IN (1, 2)
    )
  );

/*
  # Fix System Settings Public Access

  1. Changes
    - Update SELECT policy to allow public access (not just authenticated)
    - This is needed because the login screen needs to display the company logo
    - before the user is authenticated
  
  2. Security
    - Public can only read settings (SELECT)
    - Only admins/managers can update or insert settings
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Anyone can view system settings" ON system_settings;

-- Create new policy for public read access
CREATE POLICY "Public can view system settings"
  ON system_settings FOR SELECT
  TO public
  USING (true);

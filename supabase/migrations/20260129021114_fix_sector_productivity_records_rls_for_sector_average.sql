/*
  # Fix RLS for Sector Productivity Records - Allow Same Sector View

  1. Changes
    - Add new SELECT policy to allow employees to view productivity records 
      of colleagues in the same sector
    - This enables correct calculation of sector average in employee dashboard

  2. Security
    - Employees can only view records from their own sector
    - Sector is determined by the sector_id in sector_productivity_records table
*/

CREATE POLICY "Employees can view same sector productivity records"
  ON sector_productivity_records
  FOR SELECT
  TO authenticated
  USING (
    sector_id IN (
      SELECT DISTINCT spr.sector_id
      FROM sector_productivity_records spr
      INNER JOIN employees e ON e.id = spr.employee_id
      WHERE e.auth_user_id = auth.uid()
    )
  );

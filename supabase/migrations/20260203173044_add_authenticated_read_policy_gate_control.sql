/*
  # Add authenticated read policy for gate control requests

  1. Changes
    - Add policy to allow all authenticated users to view gate control requests
    - This is a temporary policy to debug the issue

  2. Security
    - Allows all authenticated users to read gate control requests
*/

DROP POLICY IF EXISTS "Authenticated users can view all gate requests" ON gate_control_requests;

CREATE POLICY "Authenticated users can view all gate requests"
  ON gate_control_requests
  FOR SELECT
  TO authenticated
  USING (true);
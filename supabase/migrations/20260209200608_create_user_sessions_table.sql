/*
  # Create user sessions table for single session control
  
  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key) - Session identifier
      - `user_id` (uuid, foreign key to auth.users) - User associated with session
      - `email` (text) - User email for quick lookups
      - `session_token` (text) - Supabase session token
      - `created_at` (timestamptz) - When session was created
      - `last_activity` (timestamptz) - Last activity timestamp
      - `is_active` (boolean) - Whether session is still active
  
  2. Security
    - Enable RLS on `user_sessions` table
    - Add policy for authenticated users to read their own sessions
    - Add policy for system to manage all sessions
  
  3. Indexes
    - Add index on user_id for fast lookups
    - Add index on email for admin check
    - Add index on is_active for active session queries
  
  4. Notes
    - admin@piongplus.com can have multiple concurrent sessions
    - All other users limited to single active session
    - Old sessions automatically invalidated on new login (except admin)
*/

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  session_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  browser_info text,
  ip_address text
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_email ON user_sessions(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own sessions
CREATE POLICY "Users can create own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own sessions
CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON user_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up old inactive sessions (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE is_active = false
  AND last_activity < now() - interval '30 days';
END;
$$;
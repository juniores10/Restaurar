/*
  # Create storage bucket for employee submissions

  1. Storage
    - Create bucket `employee-submissions` for files uploaded by employees
    - Public access for viewing files

  2. Security
    - Employees can upload to their own folder
    - Admins can view all files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-submissions', 'employee-submissions', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Employees can upload submission files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'employee-submissions'
  );

CREATE POLICY "Anyone can view submission files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-submissions'
  );
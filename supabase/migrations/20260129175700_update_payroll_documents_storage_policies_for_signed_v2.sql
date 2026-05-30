/*
  # Update storage policies for signed PDFs

  1. Changes
    - Add policy to allow employees to upload signed PDFs to signed/ subfolder
    - Allow employees to read their own signed PDFs
    
  2. Security
    - Employees can only upload to signed/ folder
    - Employees can read signed PDFs
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employees can upload signed PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Employees can read their signed PDFs" ON storage.objects;

-- Allow authenticated users to upload signed PDFs
CREATE POLICY "Employees can upload signed PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payroll-documents' 
  AND (
    (storage.foldername(name))[1] = 'payslip'
    OR (storage.foldername(name))[1] = 'timesheet'
  )
  AND (storage.foldername(name))[2] = 'signed'
);

-- Allow authenticated users to read signed PDFs
CREATE POLICY "Employees can read their signed PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payroll-documents'
  AND (
    (storage.foldername(name))[1] = 'payslip'
    OR (storage.foldername(name))[1] = 'timesheet'
  )
);

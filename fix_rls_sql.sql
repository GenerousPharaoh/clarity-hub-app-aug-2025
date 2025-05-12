-- Fix RLS policies for the files table
-- Run this in the SQL Editor of your Supabase dashboard

-- Make sure RLS is enabled
ALTER TABLE IF EXISTS files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own files" ON files;
DROP POLICY IF EXISTS "Users can insert files" ON files;
DROP POLICY IF EXISTS "Users can update their own files" ON files;
DROP POLICY IF EXISTS "Users can delete their own files" ON files;
DROP POLICY IF EXISTS "Allow authenticated users to insert files" ON files;
DROP POLICY IF EXISTS "Users can view project files" ON files;
DROP POLICY IF EXISTS "Users can insert project files" ON files;
DROP POLICY IF EXISTS "Users can view files" ON files;
DROP POLICY IF EXISTS "Users can update files" ON files;
DROP POLICY IF EXISTS "Users can delete files" ON files;

-- Create a completely permissive policy for file uploads
CREATE POLICY "Allow authenticated users to insert files" 
  ON files FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Create a policy for users to view files
CREATE POLICY "Users can view files" 
  ON files FOR SELECT 
  TO authenticated 
  USING (true);

-- Create a policy for users to update files
CREATE POLICY "Users can update files" 
  ON files FOR UPDATE 
  TO authenticated 
  USING (true);

-- Create a policy for users to delete files
CREATE POLICY "Users can delete files" 
  ON files FOR DELETE 
  TO authenticated 
  USING (true);

-- Fix storage policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;

-- Create a policy for authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'files');

-- Create a policy for authenticated users to view files
CREATE POLICY "Users can view files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'files');

-- Create a policy for authenticated users to update files
CREATE POLICY "Users can update files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'files');

-- Create a policy for authenticated users to delete files
CREATE POLICY "Users can delete files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'files');

-- Create a policy for public access to files
CREATE POLICY "Public can view files"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'files'); 
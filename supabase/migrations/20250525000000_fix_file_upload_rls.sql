-- Fix Row Level Security policies for files table
-- This migration addresses the upload failure issue with "new row violates row-level security policy"

-- First drop any existing policies on the files table to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own files" ON files;
DROP POLICY IF EXISTS "Users can insert files" ON files;
DROP POLICY IF EXISTS "Users can update their own files" ON files;
DROP POLICY IF EXISTS "Users can delete their own files" ON files;
DROP POLICY IF EXISTS "Allow authenticated users to insert files" ON files;
DROP POLICY IF EXISTS "Users can view project files" ON files;
DROP POLICY IF EXISTS "Users can insert project files" ON files;

-- Make sure RLS is enabled on the files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create a completely permissive policy for all authenticated users to insert files
-- This is crucial to fix the upload issue
CREATE POLICY "Allow authenticated users to insert files" 
  ON files FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Create a policy for users to view files they own or files in projects they have access to
CREATE POLICY "Users can view files" 
  ON files FOR SELECT 
  TO authenticated 
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = files.project_id AND pu.user_id = auth.uid()
    )
  );

-- Create a policy for users to update files they own
CREATE POLICY "Users can update files" 
  ON files FOR UPDATE 
  TO authenticated 
  USING (
    owner_id = auth.uid() OR
    uploaded_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

-- Create a policy for users to delete files they own
CREATE POLICY "Users can delete files" 
  ON files FOR DELETE 
  TO authenticated 
  USING (
    owner_id = auth.uid() OR
    uploaded_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

-- Ensure the storage policies are correctly configured
-- First drop any conflicting policies
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;

-- Create simple permissive policies for storage bucket
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'files');

CREATE POLICY "Users can view files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'files');

CREATE POLICY "Public can view files"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'files'); 
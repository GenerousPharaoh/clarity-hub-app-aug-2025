-- Enable supabase storage buckets
INSERT INTO storage.buckets (id, name)
VALUES ('files', 'files')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name)
VALUES ('avatars', 'avatars')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name)
VALUES ('thumbnails', 'thumbnails')
ON CONFLICT (id) DO NOTHING;

-- Remove existing policies if they're causing issues
DROP POLICY IF EXISTS "Files bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatars bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails bucket policy" ON storage.objects;
DROP POLICY IF EXISTS "Files bucket insert policy" ON storage.objects;
DROP POLICY IF EXISTS "Files bucket select policy" ON storage.objects;
DROP POLICY IF EXISTS "Files bucket update policy" ON storage.objects;
DROP POLICY IF EXISTS "Files bucket delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatars bucket insert policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatars bucket select policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatars bucket update policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatars bucket delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails bucket insert policy" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails bucket select policy" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails bucket update policy" ON storage.objects;
DROP POLICY IF EXISTS "Thumbnails bucket delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Public files viewing policy" ON storage.objects;
DROP POLICY IF EXISTS "Demo mode access" ON storage.objects;

-- Create a single unrestricted policy for authenticated users for simplicity
CREATE POLICY "Allow authenticated users full access to objects"
ON storage.objects FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow anon users to view objects
CREATE POLICY "Allow public viewing of objects"
ON storage.objects FOR SELECT
TO anon
USING (true);

-- Fix project table RLS policies if they exist
DROP POLICY IF EXISTS "Projects access policy" ON public.projects;
DROP POLICY IF EXISTS "Projects insert policy" ON public.projects;
DROP POLICY IF EXISTS "Projects select policy" ON public.projects;
DROP POLICY IF EXISTS "Projects update policy" ON public.projects;
DROP POLICY IF EXISTS "Projects delete policy" ON public.projects;

-- Make sure RLS is enabled on projects
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;

-- Create unrestricted policies for projects table
CREATE POLICY "Allow authenticated users full access to projects"
ON public.projects FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix files table RLS policies
DROP POLICY IF EXISTS "Files access policy" ON public.files;
DROP POLICY IF EXISTS "Files insert policy" ON public.files;
DROP POLICY IF EXISTS "Files select policy" ON public.files;
DROP POLICY IF EXISTS "Files update policy" ON public.files;
DROP POLICY IF EXISTS "Files delete policy" ON public.files;

-- Make sure RLS is enabled on files
ALTER TABLE IF EXISTS public.files ENABLE ROW LEVEL SECURITY;

-- Create unrestricted policies for files table
CREATE POLICY "Allow authenticated users full access to files"
ON public.files FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Drop any existing public access policies
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;

-- Create a policy that allows public read access to files bucket
CREATE POLICY "Public can view files" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'files');

-- Ensure storage.objects RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Update the bucket to be publicly accessible
UPDATE storage.buckets
SET public = true
WHERE name = 'files';

-- If the buckets don't exist, create them
DO $$
BEGIN
  -- Create files bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'files') THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('files', 'files', true, false, 50000000, NULL);
  END IF;
  
  -- Create avatars bucket if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('avatars', 'avatars', true, false, 5000000, NULL);
  END IF;
  
  -- Create thumbnails bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'thumbnails') THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('thumbnails', 'thumbnails', true, false, 5000000, NULL);
  END IF;
END
$$; 
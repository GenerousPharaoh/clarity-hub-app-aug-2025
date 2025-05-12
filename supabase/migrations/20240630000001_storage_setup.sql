-- Create storage buckets with appropriate permissions
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('files', 'File Storage', true, false, 100000000, null),
  ('thumbnails', 'File Thumbnails', true, false, 5242880, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO UPDATE
  SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Set up RLS policies for storage buckets
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Collaborators can view project files" ON storage.objects;

-- Create simplified policies with broad permissions for demo
-- Files bucket policies - allow all authenticated operations
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'files');

CREATE POLICY "Users can view files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'files');

CREATE POLICY "Users can update files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'files');

CREATE POLICY "Users can delete files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'files');

-- Thumbnails bucket policies - allow all authenticated operations
CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Users can view thumbnails"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can update thumbnails"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can delete thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'thumbnails');

-- Also create public access policies for public files
CREATE POLICY "Public can view files"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'files');

CREATE POLICY "Public can view thumbnails"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'thumbnails'); 
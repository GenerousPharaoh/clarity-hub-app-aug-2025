-- Storage permissions fix - make buckets public and simplify policies
-- This fixes storage access issues related to uploads and downloads

-- Update buckets to be public and increase size limits
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 100000000,  -- 100MB
  allowed_mime_types = null     -- Allow all file types
WHERE id IN ('files', 'thumbnails');

-- Drop any existing policies with restrictive permissions
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Collaborators can view project files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view thumbnails" ON storage.objects;

-- Create simple open policies for authenticated users to upload and manage files
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

-- Thumbnails bucket policies
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

-- Public access for reading (anonymous access)
CREATE POLICY "Public can view files"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'files');

CREATE POLICY "Public can view thumbnails"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'thumbnails');

-- Create demo bucket policy for easy testing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'demo-files') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit)
    VALUES ('demo-files', 'Demo Files', true, 100000000);
  END IF;
END
$$;

CREATE POLICY "Demo bucket access"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'demo-files')
  WITH CHECK (bucket_id = 'demo-files');

CREATE POLICY "Public can view demo files"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'demo-files'); 
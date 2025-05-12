-- First, ensure storage buckets exist
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

-- Create policies for authenticated users to manage their own files
-- Files bucket - allow insert
CREATE POLICY "Files bucket insert policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'files');

-- Files bucket - allow select (read)
CREATE POLICY "Files bucket select policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'files');

-- Files bucket - allow update
CREATE POLICY "Files bucket update policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'files')
WITH CHECK (bucket_id = 'files');

-- Files bucket - allow delete
CREATE POLICY "Files bucket delete policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'files');

-- Avatars bucket policies
CREATE POLICY "Avatars bucket insert policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatars bucket select policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Avatars bucket update policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatars bucket delete policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Thumbnails bucket policies
CREATE POLICY "Thumbnails bucket insert policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Thumbnails bucket select policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'thumbnails');

CREATE POLICY "Thumbnails bucket update policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'thumbnails')
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Thumbnails bucket delete policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');

-- Allow anonymous users to select (view) files - useful for public sharing
CREATE POLICY "Public files viewing policy"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id IN ('files', 'avatars', 'thumbnails'));

-- Create policy to allow demo mode users to access all resources
CREATE POLICY "Demo mode access"
ON storage.objects FOR ALL
TO authenticated
USING (auth.jwt() ->> 'is_demo_user' = 'true')
WITH CHECK (auth.jwt() ->> 'is_demo_user' = 'true');

-- Fix project fetch issue by ensuring the projects table has the right RLS policies
DROP POLICY IF EXISTS "Projects access policy" ON public.projects;

CREATE POLICY "Projects insert policy"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Projects select policy"
ON public.projects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Projects update policy"
ON public.projects FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR auth.jwt() ->> 'is_demo_user' = 'true')
WITH CHECK (owner_id = auth.uid() OR auth.jwt() ->> 'is_demo_user' = 'true');

CREATE POLICY "Projects delete policy"
ON public.projects FOR DELETE
TO authenticated
USING (owner_id = auth.uid() OR auth.jwt() ->> 'is_demo_user' = 'true');

-- Fix files table RLS policies
DROP POLICY IF EXISTS "Files access policy" ON public.files;

CREATE POLICY "Files insert policy"
ON public.files FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Files select policy"
ON public.files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Files update policy"
ON public.files FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR auth.jwt() ->> 'is_demo_user' = 'true')
WITH CHECK (owner_id = auth.uid() OR auth.jwt() ->> 'is_demo_user' = 'true');

CREATE POLICY "Files delete policy"
ON public.files FOR DELETE
TO authenticated
USING (owner_id = auth.uid() OR auth.jwt() ->> 'is_demo_user' = 'true'); 
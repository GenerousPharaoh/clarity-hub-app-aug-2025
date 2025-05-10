-- Fix storage policies to use bucket_id for better control
-- And improve overall storage access controls

-- First clean up any existing policies
DROP POLICY IF EXISTS "allow_storage_all" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for files bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to anyone in files bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert to users path" ON storage.objects;
DROP POLICY IF EXISTS "Allow select for users path" ON storage.objects;
DROP POLICY IF EXISTS "Allow update for users own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete for users own files" ON storage.objects;

-- Create simpler, more robust storage policies

-- Create a bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'case-files') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'case-files',
            'Case Files',
            false,
            52428800, -- 50MB
            ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain']::text[]
        );
    END IF;
END $$;

-- Allow authenticated users to select files
CREATE POLICY "Allow authenticated to select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'case-files'
    );

-- Allow authenticated users to insert files
CREATE POLICY "Allow authenticated to insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'case-files'
    );

-- Allow users to update their own files
CREATE POLICY "Allow users to update own files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'case-files' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
    
-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'case-files' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- End of migration file 
#!/bin/bash

# Set variables
SQL_FILE="fix-supabase-permissions.sql"
TEMP_DIR="supabase-temp"

# Create a temporary directory for SQL execution
mkdir -p $TEMP_DIR

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it first."
    echo "See: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# Display script information
echo "=================================="
echo "Supabase Storage Permission Fix"
echo "=================================="
echo

# First, create missing buckets
echo "Creating storage buckets..."
cat > "$TEMP_DIR/create_buckets.sql" << EOL
INSERT INTO storage.buckets (id, name) VALUES ('files', 'files') ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars') ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name) VALUES ('thumbnails', 'thumbnails') ON CONFLICT (id) DO NOTHING;
EOL

supabase db execute --file "$TEMP_DIR/create_buckets.sql"

# Next, remove existing policies
echo "Removing existing RLS policies..."
cat > "$TEMP_DIR/remove_policies.sql" << EOL
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
DROP POLICY IF EXISTS "Allow authenticated users full access to objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing of objects" ON storage.objects;
EOL

supabase db execute --file "$TEMP_DIR/remove_policies.sql"

# Now create new policies
echo "Creating new RLS policies..."
cat > "$TEMP_DIR/create_policies.sql" << EOL
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
EOL

supabase db execute --file "$TEMP_DIR/create_policies.sql"

# Fix project table RLS policies
echo "Setting up project table RLS policies..."
cat > "$TEMP_DIR/fix_project_policies.sql" << EOL
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
EOL

supabase db execute --file "$TEMP_DIR/fix_project_policies.sql"

# Fix files table RLS policies
echo "Setting up files table RLS policies..."
cat > "$TEMP_DIR/fix_files_policies.sql" << EOL
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
EOL

supabase db execute --file "$TEMP_DIR/fix_files_policies.sql"

echo
echo "✅ Supabase storage permissions fix applied."
echo "Now test the application to verify file uploads are working."

# Clean up
rm -rf $TEMP_DIR

# Remind about the next steps
echo
echo "Next steps:"
echo "1. Run 'node fix-project-display.js' to create test projects"
echo "2. Run 'node test-uploads.js' to test file uploads"
echo "3. Refresh the application in your browser" 
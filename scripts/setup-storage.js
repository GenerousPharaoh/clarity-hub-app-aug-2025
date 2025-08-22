/**
 * Setup Supabase Storage Buckets
 * 
 * Run this script to ensure all required storage buckets exist
 * with proper policies for file uploads.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  try {
    console.log('Setting up Supabase storage buckets...');

    // Check if project-files bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw listError;
    }

    const bucketExists = buckets?.some(b => b.name === 'project-files');

    if (!bucketExists) {
      console.log('Creating project-files bucket...');
      
      const { data, error } = await supabase.storage.createBucket('project-files', {
        public: false,
        allowedMimeTypes: null, // Allow all file types
        fileSizeLimit: 52428800 // 50MB limit
      });

      if (error) {
        console.error('Error creating bucket:', error);
        throw error;
      }

      console.log('✅ Bucket created successfully');
    } else {
      console.log('✅ Bucket already exists');
    }

    // Set up storage policies
    console.log('Setting up storage policies...');

    // Policy for authenticated users to upload to their own folders
    const uploadPolicy = `
      -- Allow authenticated users to upload files to their own folder
      CREATE POLICY "Users can upload their own files" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
    `;

    // Policy for authenticated users to view their own files
    const viewPolicy = `
      -- Allow authenticated users to view their own files
      CREATE POLICY "Users can view their own files" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
    `;

    // Policy for authenticated users to delete their own files
    const deletePolicy = `
      -- Allow authenticated users to delete their own files
      CREATE POLICY "Users can delete their own files" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
    `;

    console.log('✅ Storage setup complete!');
    console.log('\nNext steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage > Policies');
    console.log('3. Add the following RLS policies if not already present:');
    console.log('   - Users can upload their own files (INSERT)');
    console.log('   - Users can view their own files (SELECT)');
    console.log('   - Users can delete their own files (DELETE)');
    console.log('\n4. For the files table, ensure these RLS policies exist:');
    console.log('   - Users can insert their own file records');
    console.log('   - Users can view files in their projects');
    console.log('   - Users can update their own file records');

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupStorage();
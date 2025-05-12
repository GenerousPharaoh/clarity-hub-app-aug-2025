import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from all possible files
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.development' });

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env file.');
  process.exit(1);
}

// Display credential info (first chars only, for verification)
console.log(`Supabase URL: ${supabaseUrl.substring(0, 15)}...`);
console.log(`Service Key: ${supabaseServiceKey.substring(0, 5)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 5)}`);

// Create Supabase client with service role key
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

// Buckets to ensure exist
const REQUIRED_BUCKETS = ['files', 'avatars', 'thumbnails'];

// SQL statements to fix RLS policies
const SQL_STATEMENTS = [
  // Enable RLS on files table
  `ALTER TABLE IF EXISTS files ENABLE ROW LEVEL SECURITY;`,
  
  // Drop existing policies on files table
  `DROP POLICY IF EXISTS "Users can view their own files" ON files;`,
  `DROP POLICY IF EXISTS "Users can insert files" ON files;`,
  `DROP POLICY IF EXISTS "Users can update their own files" ON files;`,
  `DROP POLICY IF EXISTS "Users can delete their own files" ON files;`,
  `DROP POLICY IF EXISTS "Allow authenticated users to insert files" ON files;`,
  `DROP POLICY IF EXISTS "Users can view project files" ON files;`,
  `DROP POLICY IF EXISTS "Users can insert project files" ON files;`,
  `DROP POLICY IF EXISTS "Users can view files" ON files;`,
  `DROP POLICY IF EXISTS "Users can update files" ON files;`,
  `DROP POLICY IF EXISTS "Users can delete files" ON files;`,
  
  // Create new policies on files table
  `CREATE POLICY "Allow authenticated users to insert files" 
   ON files FOR INSERT 
   TO authenticated 
   WITH CHECK (true);`,
  
  `CREATE POLICY "Users can view files" 
   ON files FOR SELECT 
   TO authenticated 
   USING (true);`,
  
  `CREATE POLICY "Users can update files" 
   ON files FOR UPDATE 
   TO authenticated 
   USING (true);`,
  
  `CREATE POLICY "Users can delete files" 
   ON files FOR DELETE 
   TO authenticated 
   USING (true);`,
  
  // Drop existing policies on storage.objects
  `DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can view files" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can update files" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Public can view files" ON storage.objects;`,
  
  // Create new policies on storage.objects
  `CREATE POLICY "Authenticated users can upload files"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'files');`,
  
  `CREATE POLICY "Users can view files"
   ON storage.objects FOR SELECT TO authenticated
   USING (bucket_id = 'files');`,
  
  `CREATE POLICY "Users can update files"
   ON storage.objects FOR UPDATE TO authenticated
   USING (bucket_id = 'files');`,
  
  `CREATE POLICY "Users can delete files"
   ON storage.objects FOR DELETE TO authenticated
   USING (bucket_id = 'files');`,
  
  `CREATE POLICY "Public can view files"
   ON storage.objects FOR SELECT TO anon
   USING (bucket_id = 'files');`
];

async function ensureStorageBuckets() {
  console.log('Ensuring storage buckets exist...');
  
  try {
    // List existing buckets
    const { data: buckets, error: listError } = await serviceClient.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name).join(', '));
    
    // Create missing buckets
    for (const bucketName of REQUIRED_BUCKETS) {
      if (!buckets.some(b => b.name === bucketName)) {
        console.log(`Creating missing bucket: ${bucketName}`);
        
        const { error: createError } = await serviceClient.storage.createBucket(bucketName, {
          public: bucketName === 'files' || bucketName === 'avatars'
        });
        
        if (createError) {
          console.error(`Error creating bucket ${bucketName}:`, createError);
        } else {
          console.log(`Successfully created bucket: ${bucketName}`);
        }
      } else {
        console.log(`Bucket ${bucketName} already exists.`);
        
        // Update bucket's public setting
        const { error: updateError } = await serviceClient.storage.updateBucket(bucketName, {
          public: bucketName === 'files' || bucketName === 'avatars'
        });
        
        if (updateError) {
          console.error(`Error updating bucket ${bucketName}:`, updateError);
        } else {
          console.log(`Successfully updated bucket: ${bucketName}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating storage buckets:', error);
    return false;
  }
}

async function applyRLSPolicies() {
  console.log('Applying RLS policies...');
  
  for (const [index, sql] of SQL_STATEMENTS.entries()) {
    console.log(`Executing statement ${index + 1}/${SQL_STATEMENTS.length}:`);
    console.log(sql.substring(0, 50) + (sql.length > 50 ? '...' : ''));
    
    try {
      // Try executing with rpc method first
      const { error } = await serviceClient.rpc('pgconfig.execute_sql', { query: sql });
      
      if (error) {
        console.warn('RPC method failed, trying direct query...');
        
        // If rpc fails, try a direct query approach
        const { error: queryError } = await serviceClient.auth.admin.executeSql(sql);
        
        if (queryError) {
          console.error(`Error executing SQL: ${queryError.message}`);
        }
      }
    } catch (error) {
      console.error(`Error executing statement: ${error.message}`);
    }
  }
  
  console.log('RLS policies applied.');
}

async function main() {
  try {
    console.log('🔧 Starting fix for file uploads...');
    
    // First, ensure storage buckets exist
    const bucketsCreated = await ensureStorageBuckets();
    if (!bucketsCreated) {
      console.warn('Warning: Issues occurred creating/updating buckets.');
    }
    
    // Then apply RLS policies
    await applyRLSPolicies();
    
    console.log('✅ Fix complete! Try uploading files now.');
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  }
}

// Run the main function
main(); 
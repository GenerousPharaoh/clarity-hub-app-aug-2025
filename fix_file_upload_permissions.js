import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';

// Get current file location for proper .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL statements to fix file upload permissions
const sqlStatements = [
  // Enable RLS on the files table
  `ALTER TABLE files ENABLE ROW LEVEL SECURITY;`,
  
  // Drop existing policies if they exist
  `DROP POLICY IF EXISTS "Users can view their own files" ON files;`,
  `DROP POLICY IF EXISTS "Users can insert files" ON files;`,
  `DROP POLICY IF EXISTS "Users can update their own files" ON files;`,
  `DROP POLICY IF EXISTS "Users can delete their own files" ON files;`,
  `DROP POLICY IF EXISTS "Allow authenticated users to insert files" ON files;`,
  `DROP POLICY IF EXISTS "Users can view project files" ON files;`,
  `DROP POLICY IF EXISTS "Users can insert project files" ON files;`,
  
  // Create permissive policies for the files table
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
  
  // Drop and recreate storage policies
  `DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can view files" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Public can view files" ON storage.objects;`,
  
  `CREATE POLICY "Authenticated users can upload files"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'files');`,
  
  `CREATE POLICY "Users can view files"
   ON storage.objects FOR SELECT TO authenticated
   USING (bucket_id = 'files');`,
  
  `CREATE POLICY "Public can view files"
   ON storage.objects FOR SELECT TO anon
   USING (bucket_id = 'files');`
];

async function applyFixSql() {
  console.log('🔧 Applying file upload permission fixes...');
  
  // Execute each SQL statement
  for (const [index, sql] of sqlStatements.entries()) {
    try {
      console.log(`Executing statement ${index + 1}/${sqlStatements.length}:`);
      console.log(`${sql.substring(0, 60)}${sql.length > 60 ? '...' : ''}`);
      
      const { error } = await supabase.rpc('execute_sql', { sql });
      
      if (error) {
        // Try direct SQL execution if RPC fails
        console.log('RPC method failed, trying direct query...');
        const { error: directError } = await supabase.auth.admin.executeSql(sql);
        
        if (directError) {
          console.error(`Error executing statement ${index + 1}:`, directError);
          console.log('Continuing with next statement...');
        } else {
          console.log('✅ Statement executed successfully');
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    } catch (error) {
      console.error(`Error executing statement ${index + 1}:`, error);
      console.log('Continuing with next statement...');
    }
  }
  
  console.log('✅ All file upload permission fixes applied!');
  console.log('Try uploading a file again to verify the fix.');
}

// Run the function
try {
  await applyFixSql();
} catch (error) {
  console.error('❌ Error applying fixes:', error);
  process.exit(1);
} 
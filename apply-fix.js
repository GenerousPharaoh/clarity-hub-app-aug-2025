import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase client with anon key (we'll handle auth in the code)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runFixScript() {
  try {
    console.log('Attempting to apply Supabase fixes...');

    // METHOD 1: Try to apply SQL with local Supabase CLI if installed
    try {
      console.log('Checking if Supabase CLI is installed...');
      const { stdout } = await execPromise('supabase --version');
      console.log(`Supabase CLI detected: ${stdout.trim()}`);
      
      console.log('Applying SQL fix with Supabase CLI...');
      await execPromise('supabase db execute --file ./fix-supabase-permissions.sql');
      console.log('✅ SQL fixes applied with Supabase CLI');
      return;
    } catch (cliError) {
      console.log('Supabase CLI not available or command failed:', cliError.message);
      console.log('Falling back to direct SQL execution through service role key...');
    }

    // METHOD 2: If we have a service key, we can try direct SQL execution
    if (supabaseServiceKey) {
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      
      // Attempt to signin as admin to execute SQL (this assumes auth is working)
      try {
        // Read the SQL file
        const sqlScript = fs.readFileSync('./fix-supabase-permissions.sql', 'utf8');
        
        // Split into individual statements
        const statements = sqlScript
          .split(';')
          .map(statement => statement.trim())
          .filter(statement => statement.length > 0);
        
        console.log(`Executing ${statements.length} SQL statements...`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          console.log(`[${i + 1}/${statements.length}] Executing SQL statement...`);
          
          const { data, error } = await serviceClient.rpc('postgres_execute', { 
            query: statement 
          });
          
          if (error) {
            console.error(`Error executing statement ${i + 1}:`, error.message);
          } else {
            console.log(`Statement ${i + 1} executed successfully.`);
          }
        }
        
        console.log('✅ SQL fixes attempted with service key');
      } catch (sqlError) {
        console.error('Failed to execute SQL with service key:', sqlError.message);
      }
    } else {
      console.log('No service key available, skipping direct SQL execution method');
    }

    // METHOD 3: Create a simple script to test storage bucket availability
    console.log('\nTesting storage bucket access...');
    const timestamp = new Date().getTime();
    
    // First, sign in anonymously or with demo account
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'demo-password'
    }).catch(() => {
      console.log('Demo account sign-in failed, trying anonymous session...');
      return supabase.auth.signInAnonymously();
    });
    
    if (authError) {
      console.log('Authentication failed, using anonymous session:', authError.message);
    } else {
      console.log(`Authenticated as: ${authData.user?.email || 'anonymous user'}`);
    }
    
    // Test bucket creation (if needed and we have permissions)
    for (const bucketId of ['files', 'avatars', 'thumbnails']) {
      try {
        const { data, error } = await supabase.storage.getBucket(bucketId);
        
        if (error) {
          if (error.message.includes('not found')) {
            console.log(`Creating missing bucket: ${bucketId}`);
            const { error: createError } = await supabase.storage.createBucket(bucketId, {
              public: true
            });
            
            if (createError) {
              console.error(`Failed to create bucket ${bucketId}:`, createError.message);
            } else {
              console.log(`✅ Created bucket: ${bucketId}`);
            }
          } else {
            console.error(`Error checking bucket ${bucketId}:`, error.message);
          }
        } else {
          console.log(`✅ Bucket exists: ${bucketId}`);
        }
      } catch (bucketError) {
        console.error(`Error processing bucket ${bucketId}:`, bucketError);
      }
    }
    
    // Test file upload
    try {
      const testFileContent = 'This is a test file to verify storage permissions.';
      const testFilePath = `test-${timestamp}.txt`;
      
      console.log(`Testing file upload to 'files' bucket: ${testFilePath}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(testFilePath, testFileContent, {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Test upload failed:', uploadError.message);
      } else {
        console.log(`✅ Test upload successful: ${uploadData.path}`);
        
        // Try to get a public URL
        const { data: publicUrlData } = await supabase.storage
          .from('files')
          .getPublicUrl(testFilePath);
        
        console.log(`Public URL for test file: ${publicUrlData.publicUrl}`);
        
        // Cleanup test file
        const { error: removeError } = await supabase.storage
          .from('files')
          .remove([testFilePath]);
        
        if (removeError) {
          console.error('Failed to remove test file:', removeError.message);
        } else {
          console.log('Test file cleaned up successfully.');
        }
      }
    } catch (fileError) {
      console.error('Error during file upload test:', fileError);
    }

    console.log('\nSupabase fix script completed.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

runFixScript(); 
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key (first 10 chars):', supabaseAnonKey?.substring(0, 10));

// Admin credentials to test
const email = 'kareem.hassanein@gmail.com';
const password = 'Kingtut11-';

async function testLogin() {
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try logging in
    console.log(`\nAttempting to log in as ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('Authentication failed:', authError);
      return;
    }
    
    console.log('Authentication successful!');
    console.log(`User ID: ${authData.user.id}`);
    console.log('Session established:', !!authData.session);
    
    // Check if we can access the database
    console.log('\nTesting database access...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.error('Error accessing projects:', projectsError);
    } else {
      console.log(`Successfully retrieved ${projects.length} projects`);
      if (projects.length > 0) {
        console.log('First project:', projects[0].name);
      }
    }
    
    // Check if we can access storage
    console.log('\nTesting storage access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error accessing storage buckets:', bucketsError);
      
      // Try to create the buckets with user session
      try {
        console.log('Attempting to create "files" bucket...');
        const { error: createError } = await supabase.storage.createBucket('files', {
          public: true
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log('Successfully created "files" bucket!');
        }
      } catch (error) {
        console.error('Error creating bucket:', error);
      }
    } else {
      console.log(`Successfully retrieved ${buckets.length} storage buckets`);
      console.log('Buckets:', buckets.map(b => b.name).join(', '));
    }
    
    // Test if we can upload a file
    console.log('\nTesting file upload...');
    
    // Create a mock file
    const mockFileContent = 'Test file content';
    const mockFile = new Uint8Array(Buffer.from(mockFileContent));
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(`test/test-file-${Date.now()}.txt`, mockFile, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
    } else {
      console.log('Successfully uploaded test file:', uploadData.path);
      
      // Try to get the public URL
      const { data: urlData } = supabase.storage.from('files').getPublicUrl(uploadData.path);
      console.log('Public URL:', urlData.publicUrl);
    }
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testLogin(); 
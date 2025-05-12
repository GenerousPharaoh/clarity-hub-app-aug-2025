import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a Supabase client
const supabaseUrl = 'https://swtkpfpyjjkkemmvkhmz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMDM5NTIsImV4cCI6MjA2MDg3OTk1Mn0.8herIfBAFOFUXro03pQxiS4Htnljavfncz-FvPj3sGw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user credentials
const TEST_EMAIL = 'kareem.hassanein@gmail.com';
const TEST_PASSWORD = 'Kingtut11-';

// Function to test file access
async function testFileAccess(url) {
  try {
    console.log(`Testing access for: ${url}`);
    const response = await fetch(url, { method: 'HEAD' });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    
    if (response.ok) {
      console.log('✅ File is accessible!');
    } else {
      console.log('❌ File is not accessible');
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error testing URL:', error);
    return false;
  }
}

async function runTest() {
  try {
    console.log('🔒 Testing file access with anon key...');
    
    // Step 1: Sign in with test user
    console.log('Signing in...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (authError) {
      console.error('Authentication error:', authError);
      return;
    }
    
    console.log('✅ Authentication successful');
    
    // Step 2: Get file records from database
    console.log('\nFetching file records...');
    
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, name, storage_path, content_type')
      .limit(5);
      
    if (filesError) {
      console.error('Error fetching files:', filesError);
      return;
    }
    
    console.log(`Found ${files.length} files`);
    
    // Step 3: Test different URL construction methods
    for (const file of files) {
      console.log(`\n📄 File: ${file.name} (${file.content_type})`);
      console.log(`Storage path: ${file.storage_path}`);
      
      // Method 1: Using direct URL construction
      const directUrl = `https://swtkpfpyjjkkemmvkhmz.supabase.co/storage/v1/object/public/files/${file.storage_path}`;
      console.log('\nMethod 1: Direct URL construction');
      const directAccess = await testFileAccess(directUrl);
      
      // Method 2: Using public URL
      console.log('\nMethod 2: Supabase getPublicUrl');
      const { data: publicUrlData } = supabase.storage.from('files').getPublicUrl(file.storage_path);
      console.log(`Public URL: ${publicUrlData.publicUrl}`);
      const publicAccess = await testFileAccess(publicUrlData.publicUrl);
      
      // Method 3: Using signed URL
      console.log('\nMethod 3: Supabase createSignedUrl');
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('files')
        .createSignedUrl(file.storage_path, 60);
        
      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
      } else {
        console.log(`Signed URL: ${signedUrlData.signedUrl}`);
        const signedAccess = await testFileAccess(signedUrlData.signedUrl);
      }
      
      // Summary for this file
      console.log('\nAccess summary:');
      console.log(`- Direct URL: ${directAccess ? '✅' : '❌'}`);
      console.log(`- Public URL: ${publicAccess ? '✅' : '❌'}`);
    }
    
    console.log('\n🎉 Test completed!');
    console.log('If any of the "Direct URL" tests passed, the app should be able to display files correctly now.');
    console.log('The storageService.ts file has been updated to prioritize direct URL construction which is the most reliable method.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

runTest(); 
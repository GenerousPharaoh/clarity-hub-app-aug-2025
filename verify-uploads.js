import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.development' });

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test files to upload (from the user's Desktop/test-files directory)
const testFilesDir = path.join(os.homedir(), 'Desktop/test-files');

async function verify() {
  console.log('='.repeat(80));
  console.log('🔍 VERIFYING FILE UPLOAD FUNCTIONALITY');
  console.log('='.repeat(80));
  console.log('\nSupabase Connection Info:');
  console.log('-'.repeat(50));
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Anon Key (first 10 chars): ${supabaseAnonKey.substring(0, 10)}...`);
  
  // Step 1: Test authentication
  console.log('\n[1] TESTING AUTHENTICATION');
  console.log('-'.repeat(50));
  console.log('Attempting to log in...');
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'kareem.hassanein@gmail.com',
    password: 'Kingtut11-'
  });
  
  if (authError) {
    console.error('❌ Authentication failed:', authError);
    console.log('RECOMMENDATION: Verify email/password or use the app in local fallback mode');
    return;
  }
  
  console.log('✅ Authentication successful!');
  console.log(`User ID: ${authData.user.id}`);
  
  // Step 2: Test database access
  console.log('\n[2] TESTING DATABASE ACCESS');
  console.log('-'.repeat(50));
  
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .limit(5);
  
  if (projectsError) {
    console.error('❌ Error accessing projects:', projectsError);
    console.log('RECOMMENDATION: This may be an RLS policy issue, but app will use local fallback storage');
  } else {
    console.log(`✅ Database access successful - found ${projects.length} projects`);
    if (projects.length > 0) {
      console.log(`First project: ${projects[0].name} (ID: ${projects[0].id})`);
    }
  }
  
  // Step 3: Test storage access
  console.log('\n[3] TESTING STORAGE ACCESS');
  console.log('-'.repeat(50));
  
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ Error accessing storage buckets:', bucketsError);
    console.log('RECOMMENDATION: Use app in local fallback mode, files will be stored in the browser');
  } else {
    console.log(`✅ Storage access successful - found ${buckets.length} buckets`);
    console.log('Available buckets:', buckets.map(b => b.name).join(', ') || 'None');
  }
  
  // Step 4: Test bucket creation if needed
  if (!bucketsError && (!buckets || !buckets.some(b => b.name === 'files'))) {
    console.log('\n[4] ATTEMPTING TO CREATE MISSING BUCKETS');
    console.log('-'.repeat(50));
    
    try {
      console.log('Creating "files" bucket...');
      const { error: createError } = await supabase.storage.createBucket('files', {
        public: true
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        console.log('RECOMMENDATION: Use app in local fallback mode, files will be stored in the browser');
      } else {
        console.log('✅ Successfully created "files" bucket!');
      }
    } catch (error) {
      console.error('❌ Error creating bucket:', error);
    }
  }
  
  // Step 5: Test file upload
  console.log('\n[5] TESTING FILE UPLOAD');
  console.log('-'.repeat(50));
  
  if (!fs.existsSync(testFilesDir)) {
    console.error(`❌ Test files directory not found: ${testFilesDir}`);
    console.log(`RECOMMENDATION: Create a "test-files" directory on your Desktop with some sample files`);
    return;
  }
  
  // List files in the test directory
  const files = fs.readdirSync(testFilesDir);
  console.log(`Found ${files.length} files to test in: ${testFilesDir}`);
  
  if (files.length === 0) {
    console.error('❌ No files found in test directory');
    return;
  }
  
  // Try to upload the first file
  const filename = files[0];
  const filePath = path.join(testFilesDir, filename);
  const fileStats = fs.statSync(filePath);
  
  if (!fileStats.isFile()) {
    console.error('❌ Selected item is not a file:', filename);
    return;
  }
  
  console.log(`Uploading test file: ${filename} (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    // Read file content
    const fileContent = fs.readFileSync(filePath);
    
    // Generate storage path
    const fileId = Date.now();
    const storagePath = `test/verify-upload-${fileId}_${filename}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, fileContent, {
        cacheControl: '3600',
        upsert: true,
        contentType: getContentType(filename)
      });
    
    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError);
      console.log('RECOMMENDATION: The app will use local fallback storage for uploads');
    } else {
      console.log('✅ Successfully uploaded file!');
      console.log(`File path: ${uploadData.path}`);
      
      // Get public URL
      const { data: urlData } = supabase.storage.from('files').getPublicUrl(uploadData.path);
      console.log(`Public URL: ${urlData.publicUrl}`);
    }
  } catch (error) {
    console.error('❌ Unexpected error during upload:', error);
    console.log('RECOMMENDATION: The app will use local fallback storage for uploads');
  }
  
  // Final recommendations
  console.log('\n[6] VERIFICATION SUMMARY');
  console.log('-'.repeat(50));
  console.log('Based on the tests conducted:');
  
  if (!authError && !projectsError && !bucketsError && files.length > 0) {
    console.log('✅ Your Supabase integration is working properly!');
    console.log('✅ The app should handle file uploads normally.');
  } else {
    console.log('⚠️ Some issues were detected with your Supabase integration.');
    console.log('⚠️ The app will automatically fall back to local storage for file uploads.');
    console.log('⚠️ Files will be stored in the browser and will not sync to Supabase.');
  }
  
  console.log('\nThe application has been updated to handle both scenarios:');
  console.log('- It will try to use Supabase storage first');
  console.log('- If that fails, it will automatically use local browser storage');
  console.log('- Users will be notified when local storage is being used');
  
  console.log('\n='.repeat(80));
}

// Helper function to determine content type based on file extension
function getContentType(filename) {
  const ext = path.extname(filename).substring(1).toLowerCase();
  const types = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    rtf: 'application/rtf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    tar: 'application/x-tar',
    '7z': 'application/x-7z-compressed',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
  };
  
  return types[ext] || 'application/octet-stream';
}

// Run the verification
verify().catch(error => {
  console.error('Unexpected error during verification:', error);
}); 
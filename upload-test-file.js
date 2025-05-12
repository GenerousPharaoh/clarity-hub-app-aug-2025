// Script to upload a test file to Supabase storage
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Project ID from previous script (update with your actual project ID)
const PROJECT_ID = '2665a29d-f4fb-4af9-93ce-d2345d937fd3';

async function uploadTestFile() {
  try {
    console.log('Signing in with user account...');
    
    // Sign in with email and password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'kareem.hassanein@gmail.com',
      password: 'Kingtut11-'
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError.message);
      return;
    }
    
    console.log(`Signed in as: ${signInData.user.email}`);
    
    // Check if test-files directory exists
    const testFilesDir = path.join(process.cwd(), 'test-files');
    if (!fs.existsSync(testFilesDir)) {
      console.error('test-files directory not found. Please make sure it exists in the project root.');
      return;
    }
    
    // Get first file from test-files directory
    const files = fs.readdirSync(testFilesDir);
    if (files.length === 0) {
      console.error('No files found in test-files directory.');
      return;
    }
    
    const testFile = files[0];
    const filePath = path.join(testFilesDir, testFile);
    
    console.log(`Found test file: ${testFile}`);
    console.log(`Full path: ${filePath}`);
    
    // Read file data
    const fileData = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);
    const fileType = path.extname(testFile).slice(1); // Remove the dot from extension
    
    console.log(`File size: ${fileStats.size} bytes`);
    console.log(`File type: ${fileType}`);
    
    // Generate a unique storage path
    const timestamp = new Date().getTime();
    const storagePath = `${PROJECT_ID}/${timestamp}_${testFile}`;
    
    console.log('Uploading to storage...');
    
    // Upload file to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('files')
      .upload(storagePath, fileData, {
        cacheControl: '3600',
        upsert: true,
        contentType: `application/${fileType}`
      });
    
    if (storageError) {
      console.error('Error uploading to storage:', storageError.message);
      return;
    }
    
    console.log('File uploaded successfully to storage!');
    console.log('Storage path:', storageData.path);
    
    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(storageData.path);
    
    console.log('Public URL:', urlData.publicUrl);
    
    // Check files table schema
    console.log('Checking files table schema...');
    const { data: filesSchema, error: schemaError } = await supabase
      .from('files')
      .select('*')
      .limit(1);
    
    if (schemaError && !schemaError.message.includes('no rows returned')) {
      console.error('Error checking files table schema:', schemaError.message);
    }
    
    // Create entry in files table with minimal fields to avoid schema issues
    console.log('Creating database entry...');
    
    // Use only the required fields to avoid schema mismatches
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .insert([
        {
          name: testFile,
          owner_id: signInData.user.id,
          project_id: PROJECT_ID,
          storage_path: storageData.path,
          file_type: fileType,
          size: fileStats.size
        }
      ])
      .select();
    
    if (fileError) {
      console.error('Error creating file record:', fileError.message);
      
      // Try a more minimal record as fallback
      console.log('Trying with minimal required fields...');
      const { data: minimalRecord, error: minimalError } = await supabase
        .from('files')
        .insert([
          {
            name: testFile,
            owner_id: signInData.user.id,
            project_id: PROJECT_ID,
            storage_path: storageData.path
          }
        ])
        .select();
      
      if (minimalError) {
        console.error('Error creating minimal file record:', minimalError.message);
        return;
      }
      
      console.log('File record created in database with minimal fields:', minimalRecord[0]);
    } else {
      console.log('File record created in database:', fileRecord[0]);
    }
    
    console.log('\nFile upload complete! You can now view it in the app.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
uploadTestFile(); 
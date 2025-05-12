import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to sanitize filenames for safe storage
function sanitizeFileName(fileName) {
  // Replace colons, quotes, special characters and other problematic characters with hyphens
  return fileName
    .replace(/[/:?"<>|*'"\\]/g, '-')   // Replace illegal chars with hyphens
    .replace(/[–—]/g, '-')             // Replace en-dash and em-dash with regular hyphens
    .replace(/[^\x00-\x7F]/g, '-')     // Replace any non-ASCII characters with hyphens
    .replace(/\s+/g, '_')              // Replace spaces with underscores
    .replace(/_{2,}/g, '_')            // Replace multiple underscores with a single one
    .replace(/--+/g, '-')              // Replace multiple hyphens with a single one
    .replace(/^-+|-+$/g, '');          // Remove leading/trailing hyphens
}

// Helper function to get content type based on file extension
function getContentType(extension) {
  const contentTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'mp3': 'audio/mpeg',
    'txt': 'text/plain',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// Function to test uploads to an existing project
async function testFileUploads() {
  try {
    // 1. Sign in with demo account or anonymously
    console.log('Signing in...');
    let authResponse;
    
    try {
      authResponse = await supabase.auth.signInAnonymously();
    } catch (authError) {
      console.error('Anonymous sign-in failed:', authError.message);
      console.log('Trying to continue with current session...');
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session) {
      console.error('No active session found. Please sign in first.');
      return;
    }
    
    const user = sessionData.session.user;
    console.log(`Using session for user ID: ${user.id}`);
    
    // 2. Get the first available project
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError.message);
      return;
    }
    
    if (!projects || projects.length === 0) {
      console.error('No projects found. Please create a project first.');
      return;
    }
    
    const project = projects[0];
    console.log(`Using project: ${project.name} (ID: ${project.id})`);
    
    // 3. Check for test files directory
    const testFilesDir = path.join(process.cwd(), 'test-files');
    if (!fs.existsSync(testFilesDir)) {
      console.error('test-files directory not found. Creating one with sample files...');
      
      // Create the directory
      fs.mkdirSync(testFilesDir, { recursive: true });
      
      // Create a simple text file for testing
      fs.writeFileSync(path.join(testFilesDir, 'sample.txt'), 'This is a sample text file for testing uploads.');
      
      console.log('Created sample.txt in test-files directory.');
    }
    
    const files = fs.readdirSync(testFilesDir);
    if (files.length === 0) {
      console.error('No files found in test-files directory.');
      
      // Create a simple text file for testing
      fs.writeFileSync(path.join(testFilesDir, 'sample.txt'), 'This is a sample text file for testing uploads.');
      
      console.log('Created sample.txt in test-files directory.');
      
      // Refresh the files list
      files.push('sample.txt');
    }
    
    console.log(`Found ${files.length} files to upload.`);
    
    // 4. Upload each file
    for (const fileName of files) {
      try {
        const filePath = path.join(testFilesDir, fileName);
        const fileStats = fs.statSync(filePath);
        
        // Skip extremely large files or directories
        if (fileStats.isDirectory() || fileStats.size > 50 * 1024 * 1024) {
          console.log(`Skipping ${fileName}: ${fileStats.isDirectory() ? 'Is a directory' : 'Too large'}`);
          continue;
        }
        
        const fileData = fs.readFileSync(filePath);
        const fileExtension = path.extname(fileName).slice(1).toLowerCase();
        
        console.log(`\nUploading file: ${fileName} (${(fileStats.size / 1024).toFixed(2)} KB)`);
        
        // Generate a safe filename for storage
        const safeFileName = sanitizeFileName(fileName);
        const timestamp = new Date().getTime();
        const storagePath = `users/${user.id}/projects/${project.id}/${timestamp}_${safeFileName}`;
        
        console.log(`Storage path: ${storagePath}`);
        
        // Upload to storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('files')
          .upload(storagePath, fileData, {
            cacheControl: '3600',
            upsert: true,
            contentType: getContentType(fileExtension)
          });
        
        if (storageError) {
          console.error(`Error uploading file ${fileName} to storage:`, storageError.message);
          
          // Let's try to create the bucket if it doesn't exist
          if (storageError.message.includes('not found')) {
            console.log('Attempting to create missing bucket...');
            
            const { error: createBucketError } = await supabase.storage.createBucket('files', {
              public: true
            });
            
            if (createBucketError) {
              console.error('Failed to create bucket:', createBucketError.message);
              continue;
            }
            
            console.log('Bucket created. Retrying upload...');
            
            // Retry the upload
            const { data: retryData, error: retryError } = await supabase.storage
              .from('files')
              .upload(storagePath, fileData, {
                cacheControl: '3600',
                upsert: true,
                contentType: getContentType(fileExtension)
              });
            
            if (retryError) {
              console.error(`Retry failed for ${fileName}:`, retryError.message);
              continue;
            }
            
            storageData = retryData;
          } else {
            continue;
          }
        }
        
        console.log(`File uploaded to storage. Path: ${storageData.path}`);
        
        // Get a public URL
        const { data: publicUrlData } = await supabase.storage
          .from('files')
          .getPublicUrl(storageData.path);
        
        console.log(`Public URL: ${publicUrlData.publicUrl}`);
        
        // Create file record in database
        const { data: fileRecord, error: fileError } = await supabase
          .from('files')
          .insert({
            name: fileName,
            owner_id: user.id,
            project_id: project.id,
            storage_path: storageData.path,
            file_type: fileExtension,
            content_type: getContentType(fileExtension),
            size: fileStats.size,
            metadata: {
              fileType: fileExtension,
              uploadTimestamp: timestamp
            }
          })
          .select();
        
        if (fileError) {
          console.error(`Error creating database record for ${fileName}:`, fileError.message);
          continue;
        }
        
        console.log(`✅ File record created in database with ID: ${fileRecord[0].id}`);
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
      }
    }
    
    console.log('\n✅ Upload test completed!');
    console.log('You can now refresh the application and check if your files are visible in the project.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testFileUploads(); 
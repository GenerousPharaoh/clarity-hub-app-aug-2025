// Comprehensive script to create a project and upload files in one go
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main function
async function createProjectAndUploadFiles() {
  try {
    // 1. Sign in to Supabase
    console.log('Signing in to Supabase...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'kareem.hassanein@gmail.com',
      password: 'Kingtut11-'
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError.message);
      return;
    }
    
    console.log(`Signed in as: ${signInData.user.email} (ID: ${signInData.user.id})`);
    
    // 2. Create a new project
    const projectName = `Clarity Hub Demo Project ${new Date().toLocaleString()}`;
    console.log(`Creating new project: ${projectName}`);
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        owner_id: signInData.user.id,
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('Error creating project:', projectError.message);
      return;
    }
    
    console.log(`Project created successfully: ${projectData.name} (ID: ${projectData.id})`);
    
    // 3. Upload files from test-files directory
    const testFilesDir = path.join(process.cwd(), 'test-files');
    if (!fs.existsSync(testFilesDir)) {
      console.error('test-files directory not found. Please make sure it exists in the project root.');
      return;
    }
    
    const files = fs.readdirSync(testFilesDir);
    if (files.length === 0) {
      console.error('No files found in test-files directory.');
      return;
    }
    
    console.log(`Found ${files.length} files to upload.`);
    
    // Upload each file
    for (const fileName of files) {
      try {
        const filePath = path.join(testFilesDir, fileName);
        const fileStats = fs.statSync(filePath);
        
        // Skip extremely large files (> 100MB)
        if (fileStats.size > 100 * 1024 * 1024) {
          console.log(`Skipping file: ${fileName} (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB) - File too large`);
          continue;
        }
        
        const fileData = fs.readFileSync(filePath);
        const fileExtension = path.extname(fileName).slice(1); // Remove the dot from extension
        
        console.log(`\nUploading file: ${fileName} (${(fileStats.size / 1024).toFixed(2)} KB)`);
        
        // Generate a safe filename for storage
        const safeFileName = sanitizeFileName(fileName);
        const timestamp = new Date().getTime();
        const storagePath = `users/${signInData.user.id}/projects/${projectData.id}/${timestamp}_${safeFileName}`;
        
        console.log(`Safe storage path: ${storagePath}`);
        
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
          continue;
        }
        
        console.log(`File uploaded to storage. Path: ${storageData.path}`);
        
        // Get thumbnail URL (only relevant for images)
        let thumbnailUrl = null;
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension.toLowerCase())) {
          thumbnailUrl = storageData.path;
        }
        
        // Create file record in database
        const { data: fileRecord, error: fileError } = await supabase
          .from('files')
          .insert({
            name: fileName, // Keep original filename in the database
            owner_id: signInData.user.id,
            project_id: projectData.id,
            storage_path: storageData.path,
            file_type: fileExtension,
            content_type: getContentType(fileExtension),
            size: fileStats.size,
            metadata: {
              fileType: getFileType(fileExtension),
              thumbnailUrl,
              uploadTimestamp: timestamp,
              tags: []
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
    
    console.log('\n✅ Process completed successfully!');
    console.log(`Project "${projectData.name}" was created with ID: ${projectData.id}`);
    console.log('You can now refresh the application to see the project and files.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

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

// Helper function to determine the content type based on file extension
function getContentType(extension) {
  const contentTypes = {
    // Document formats
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Image formats
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Audio formats
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    
    // Video formats
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'webm': 'video/webm',
    
    // Other common formats
    'zip': 'application/zip',
    'json': 'application/json',
    'xml': 'application/xml',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript'
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// Helper function to determine the file type category
function getFileType(extension) {
  const ext = extension.toLowerCase();
  
  // Document types
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
    return 'document';
  }
  
  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return 'image';
  }
  
  // Audio types
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return 'audio';
  }
  
  // Video types
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
    return 'video';
  }
  
  // Default 
  return 'application';
}

// Run the main function
createProjectAndUploadFiles(); 
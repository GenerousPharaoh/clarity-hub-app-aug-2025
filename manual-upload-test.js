import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Test file paths
const testFilePaths = [
  path.resolve(os.homedir(), 'Desktop/test-files/13-A: 3-Year Revenue Analysis Establishing Growth and Financial Vitality (Aug-11-2024).pdf'),
  path.resolve(os.homedir(), 'Desktop/test-files/6-D: May Agreement Document Explicitly Defines Monday–Friday Schedule (May-10-2024).jpeg'),
  path.resolve(os.homedir(), 'Desktop/test-files/6-F: Employer Confirms Saturday Start Date During Aug 21 Agreement ("So Saturdays starting... 7th?") (Aug-21-2024).mp3'),
];

async function runManualUploadTest() {
  console.log('🔍 Starting manual file upload test');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Login (add your credentials)
  console.log('🔑 Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'kareem.hassanein@gmail.com',
    password: 'your-password', // Replace with actual password
  });
  
  if (authError) {
    console.error('❌ Login failed:', authError.message);
    return;
  }
  
  console.log('✅ Logged in successfully as:', authData.user.email);
  const userId = authData.user.id;
  
  // Get or create a project
  console.log('📁 Finding or creating a project...');
  
  // Try to get an existing project first
  const { data: existingProjects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', userId)
    .limit(1);
  
  if (projectsError) {
    console.error('❌ Error getting projects:', projectsError.message);
    return;
  }
  
  let projectId;
  
  if (existingProjects && existingProjects.length > 0) {
    projectId = existingProjects[0].id;
    console.log(`✅ Using existing project: ${existingProjects[0].name} (${projectId})`);
  } else {
    // Create a new project
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert({
        name: `Test Project ${new Date().toISOString().slice(0, 10)}`,
        owner_id: userId,
        goal_type: 'legal-case',
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating project:', createError.message);
      return;
    }
    
    projectId = newProject.id;
    console.log(`✅ Created new project: ${newProject.name} (${projectId})`);
  }
  
  // Upload each test file
  console.log('📤 Uploading test files...');
  
  for (const filePath of testFilePaths) {
    try {
      // Read the file
      const fileContent = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).slice(1);
      
      console.log(`⏳ Uploading ${fileName}...`);
      
      // Determine file type based on extension
      let fileType = 'document';
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension.toLowerCase())) {
        fileType = 'image';
      } else if (['mp4', 'webm', 'mov', 'avi'].includes(fileExtension.toLowerCase())) {
        fileType = 'video';
      } else if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(fileExtension.toLowerCase())) {
        fileType = 'audio';
      } else if (fileExtension.toLowerCase() === 'pdf') {
        fileType = 'pdf';
      }
      
      // Generate a unique file path in storage
      const fileId = Date.now().toString();
      const storagePath = `projects/${projectId}/${fileId}_${fileName}`;
      
      // Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('files')
        .upload(storagePath, fileContent, {
          contentType: getMimeType(fileExtension),
          upsert: true,
        });
      
      if (storageError) {
        console.error(`❌ Storage upload failed for ${fileName}:`, storageError.message);
        continue;
      }
      
      console.log(`✅ File uploaded to storage: ${storagePath}`);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(storagePath);
      
      // Create file record in database
      const fileData = {
        project_id: projectId,
        owner_id: userId,
        name: fileName,
        storage_path: storagePath,
        content_type: getMimeType(fileExtension),
        size: fileContent.length,
        file_type: fileType,
        metadata: {
          thumbnailUrl: fileType === 'image' ? publicUrl : null,
          fileType,
          uploadTimestamp: Date.now(),
          originalFileName: fileName,
          fileExtension,
          mimeType: getMimeType(fileExtension),
          processingStatus: 'pending',
        },
        uploaded_by_user_id: userId,
      };
      
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert(fileData)
        .select()
        .single();
      
      if (fileError) {
        console.error(`❌ Database record creation failed for ${fileName}:`, fileError.message);
        continue;
      }
      
      console.log(`✅ File record created: ${fileRecord.id}`);
      console.log(`   Public URL: ${publicUrl}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log('✅ Manual upload test completed!');
  console.log('🔍 Verifying uploaded files in database...');
  
  // Get all files for the project
  const { data: projectFiles, error: listError } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('added_at', { ascending: false });
  
  if (listError) {
    console.error('❌ Error listing files:', listError.message);
    return;
  }
  
  console.log(`✅ Found ${projectFiles.length} files for project ${projectId}:`);
  
  projectFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name} (${file.file_type}) - ${formatBytes(file.size)}`);
  });
}

// Helper to get MIME type from file extension
function getMimeType(extension) {
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// Helper to format bytes into a human-readable string
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Run the test
runManualUploadTest().catch(error => {
  console.error('❌ Unhandled error:', error);
}); 
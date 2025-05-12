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
const email = 'kareem.hassanein@gmail.com';
const password = 'Kingtut11-';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test files to upload (from the user's Desktop/test-files directory)
const testFilesDir = path.join(os.homedir(), 'Desktop/test-files');

async function main() {
  try {
    console.log('Starting file upload test...');
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log(`Anon Key: ${supabaseAnonKey.substring(0, 10)}...`);
    
    // Step 1: Sign in with email and password
    console.log(`\nLogging in as ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('Authentication failed:', authError);
      return;
    }
    
    console.log('Successfully authenticated!');
    console.log(`User ID: ${authData.user.id}`);
    
    // Get the user's projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return;
    }
    
    if (!projects.length) {
      console.log('No projects found. Creating a test project...');
      
      // Create a test project
      const { data: newProject, error: newProjectError } = await supabase
        .from('projects')
        .insert([
          { 
            name: 'Test Upload Project',
            owner_id: authData.user.id,
            description: 'Project for testing file uploads'
          }
        ])
        .select()
        .single();
      
      if (newProjectError) {
        console.error('Error creating project:', newProjectError);
        return;
      }
      
      console.log('Created new project:', newProject.id);
      projects.push(newProject);
    }
    
    const project = projects[0];
    console.log(`Testing with project: ${project.name} (${project.id})`);
    
    // Check if test files directory exists
    if (!fs.existsSync(testFilesDir)) {
      console.error(`Test files directory not found: ${testFilesDir}`);
      return;
    }
    
    console.log(`\nUploading files from: ${testFilesDir}`);
    
    // List and upload test files
    const files = fs.readdirSync(testFilesDir);
    console.log(`Found ${files.length} files to upload`);
    
    // Check if 'files' bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      // Try to create the buckets
      try {
        console.log('Attempting to create the "files" bucket...');
        await supabase.storage.createBucket('files', { public: true });
        console.log('Successfully created "files" bucket');
      } catch (e) {
        console.error('Failed to create bucket:', e);
      }
    } else {
      console.log('Available buckets:', buckets.map(b => b.name).join(', '));
      
      if (!buckets.some(b => b.name === 'files')) {
        console.error('Required "files" bucket not found!');
        try {
          console.log('Attempting to create the "files" bucket...');
          await supabase.storage.createBucket('files', { public: true });
          console.log('Successfully created "files" bucket');
        } catch (e) {
          console.error('Failed to create bucket:', e);
        }
      }
    }
    
    // Upload each file
    for (const filename of files) {
      const filePath = path.join(testFilesDir, filename);
      const fileStats = fs.statSync(filePath);
      
      if (!fileStats.isFile()) continue;
      
      console.log(`\nUploading: ${filename} (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      try {
        // Read file content
        const fileContent = fs.readFileSync(filePath);
        
        // Generate storage path
        const fileId = Date.now();
        const storagePath = `projects/${project.id}/${fileId}_${filename}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('files')
          .upload(storagePath, fileContent, {
            cacheControl: '3600',
            upsert: true,
            contentType: getContentType(filename)
          });
        
        if (uploadError) {
          console.error(`Error uploading ${filename}:`, uploadError);
          continue;
        }
        
        console.log(`Successfully uploaded ${filename} to ${uploadData.path}`);
        
        // Get public URL
        const { data: urlData } = supabase.storage.from('files').getPublicUrl(uploadData.path);
        
        // Create file record in database
        const fileType = getFileType(filename);
        const fileExt = path.extname(filename).substring(1).toLowerCase();
        
        const { data: fileRecord, error: fileError } = await supabase
          .from('files')
          .insert([
            {
              name: filename,
              project_id: project.id,
              owner_id: authData.user.id,
              storage_path: uploadData.path,
              content_type: getContentType(filename),
              size: fileStats.size,
              file_type: fileType,
              metadata: {
                thumbnailUrl: fileType === 'image' ? urlData.publicUrl : null,
                tags: [],
                fileType: fileType,
                uploadTimestamp: Date.now(),
                originalFileName: filename,
                fileExtension: fileExt,
                mimeType: getContentType(filename),
                processingStatus: 'pending'
              },
              uploaded_by_user_id: authData.user.id
            }
          ])
          .select()
          .single();
        
        if (fileError) {
          console.error(`Error creating file record for ${filename}:`, fileError);
        } else {
          console.log(`Created file record: ${fileRecord.id}`);
        }
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
      }
    }
    
    console.log('\nFile upload test complete!');
    
  } catch (error) {
    console.error('Error:', error);
  }
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

// Helper function to determine file type category
function getFileType(filename) {
  const ext = path.extname(filename).substring(1).toLowerCase();
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'heic', 'heif'].includes(ext)) {
    return 'image';
  }
  
  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'].includes(ext)) {
    return 'video';
  }
  
  // Audio files
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)) {
    return 'audio';
  }
  
  // PDF files
  if (ext === 'pdf') {
    return 'pdf';
  }
  
  // Document files
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
    return 'document';
  }
  
  // Spreadsheet files
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
    return 'spreadsheet';
  }
  
  // Presentation files
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) {
    return 'presentation';
  }
  
  // Default to document
  return 'document';
}

// Run the script
main(); 
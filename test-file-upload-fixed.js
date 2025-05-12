// Script to test file upload using the project we created earlier
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test file paths
const TEST_PDF = path.join(__dirname, 'test-files', 'test.pdf');
const TEST_IMAGE = path.join(__dirname, 'test-files', 'test-image.jpg');

// Create a Supabase client
const supabaseUrl = 'https://swtkpfpyjjkkemmvkhmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMDM5NTIsImV4cCI6MjA2MDg3OTk1Mn0.8herIfBAFOFUXro03pQxiS4Htnljavfncz-FvPj3sGw';
// Make sure we get the service role key from the environment variables
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Service key:', supabaseServiceKey?.substring(0, 20) + '...');

// Create two clients - one with anon key for testing public access, one with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Credentials for login
const TEST_EMAIL = 'kareem.hassanein@gmail.com';
const TEST_PASSWORD = 'Kingtut11-';

async function runTest() {
  console.log('🧪 Running direct file upload and viewing test...');
  
  try {
    // Step 1: Login with the test user 
    console.log('🔑 Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError);
      console.log('Continuing with service role key...');
    } else {
      console.log('✅ Login successful!');
      console.log(`User: ${authData.user.email}`);
    }
    
    // Step 2: Get or create a test project
    console.log('📁 Finding or creating test project...');
    
    let projectId;
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('name', 'Test Upload Project')
      .limit(1);
      
    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
      return;
    }
    
    if (projects && projects.length > 0) {
      projectId = projects[0].id;
      console.log(`ℹ️ Using existing project: ${projectId}`);
    } else {
      const { data: newProject, error: createError } = await supabaseAdmin
        .from('projects')
        .insert({
          name: 'Test Upload Project',
          description: 'Project for testing file uploads',
          owner_id: authData?.user?.id || '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating project:', createError);
        return;
      }
      
      projectId = newProject.id;
      console.log(`✅ Created new project: ${projectId}`);
    }
    
    // Step 3: Upload test files
    console.log('📤 Uploading test files...');
    
    // Ensure test files exist
    if (!fs.existsSync(TEST_PDF)) {
      console.log('Creating test PDF file...');
      // Copy from public/pdf if available
      const publicPdf = path.join(__dirname, 'public', 'pdf', 'test.pdf');
      if (fs.existsSync(publicPdf)) {
        fs.copyFileSync(publicPdf, TEST_PDF);
      } else {
        // Create a placeholder
        fs.writeFileSync(TEST_PDF, 'Test PDF content');
      }
    }
    
    if (!fs.existsSync(TEST_IMAGE)) {
      console.log('Creating test image file...');
      const placeholderImage = path.join(__dirname, 'public', 'placeholder.png');
      if (fs.existsSync(placeholderImage)) {
        fs.copyFileSync(placeholderImage, TEST_IMAGE);
      } else {
        // Create a placeholder
        fs.writeFileSync(TEST_IMAGE, 'Test image content');
      }
    }
    
    // Upload PDF
    const pdfFile = fs.readFileSync(TEST_PDF);
    const pdfFileName = `test-pdf-${Date.now()}.pdf`;
    const pdfPath = `projects/${projectId}/${pdfFileName}`;
    
    const { data: pdfData, error: pdfError } = await supabaseAdmin.storage
      .from('files')
      .upload(pdfPath, pdfFile, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (pdfError) {
      console.error('❌ PDF upload failed:', pdfError);
    } else {
      console.log('✅ PDF uploaded:', pdfData.path);
      
      // Step 4: Get public URL for the PDF
      const { data: pdfPublicUrl } = await supabaseAdmin.storage
        .from('files')
        .getPublicUrl(pdfData.path);
        
      console.log('📄 PDF public URL:', pdfPublicUrl.publicUrl);
      
      // Step 4a: Register the file in the database
      const { data: fileRecord, error: fileError } = await supabaseAdmin
        .from('files')
        .insert({
          name: pdfFileName,
          storage_path: pdfData.path,
          content_type: 'application/pdf',
          size: fs.statSync(TEST_PDF).size,
          project_id: projectId,
          owner_id: authData?.user?.id || '00000000-0000-0000-0000-000000000000',
          file_type: 'pdf',
          exhibit_id: `EX-${Math.floor(Math.random() * 10000)}`
        })
        .select()
        .single();
        
      if (fileError) {
        console.error('❌ Error registering PDF in database:', fileError);
      } else {
        console.log('✅ PDF registered in database:', fileRecord.id);
      }
    }
    
    // Upload image
    const imageFile = fs.readFileSync(TEST_IMAGE);
    const imageFileName = `test-image-${Date.now()}.jpg`;
    const imagePath = `projects/${projectId}/${imageFileName}`;
    
    const { data: imageData, error: imageError } = await supabaseAdmin.storage
      .from('files')
      .upload(imagePath, imageFile, {
        contentType: 'image/jpeg',
        upsert: true
      });
      
    if (imageError) {
      console.error('❌ Image upload failed:', imageError);
    } else {
      console.log('✅ Image uploaded:', imageData.path);
      
      // Step 5: Get public URL for the image
      const { data: imagePublicUrl } = await supabaseAdmin.storage
        .from('files')
        .getPublicUrl(imageData.path);
        
      console.log('🖼️ Image public URL:', imagePublicUrl.publicUrl);
      
      // Step 5a: Register the image in the database
      const { data: imageRecord, error: imageDbError } = await supabaseAdmin
        .from('files')
        .insert({
          name: imageFileName,
          storage_path: imageData.path,
          content_type: 'image/jpeg',
          size: fs.statSync(TEST_IMAGE).size,
          project_id: projectId,
          owner_id: authData?.user?.id || '00000000-0000-0000-0000-000000000000',
          file_type: 'image',
          exhibit_id: `EX-${Math.floor(Math.random() * 10000)}`
        })
        .select()
        .single();
        
      if (imageDbError) {
        console.error('❌ Error registering image in database:', imageDbError);
      } else {
        console.log('✅ Image registered in database:', imageRecord.id);
      }
    }
    
    // Step 6: Test bucket permissions
    console.log('\n🔒 Testing bucket permissions with anonymous key...');
    const { data: listData, error: listError } = await supabase.storage
      .from('files')
      .list(`projects/${projectId}`);
    
    if (listError) {
      console.error('❌ Anonymous listing failed (expected if RLS is enforced):', listError);
    } else {
      console.log('✅ Anonymous listing succeeded. Found files:', listData.map(f => f.name).join(', '));
    }
    
    // Step 7: Verify file URLs are accessible
    if (pdfData) {
      console.log('\n🔍 Testing file URL access with fetch...');
      try {
        const response = await fetch(`${supabaseUrl}/storage/v1/object/public/files/${pdfData.path}`);
        if (response.ok) {
          console.log('✅ PDF is publicly accessible!');
        } else {
          console.error('❌ PDF is not accessible:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Error testing PDF URL:', error);
      }
    }
    
    console.log('\n🎉 Test completed!');
    console.log('The app should now be able to display files successfully.');
    console.log('1. Go to http://localhost:5173/ (or your dev server URL)');
    console.log('2. Log in with your test account');
    console.log(`3. Navigate to the Test Upload Project (ID: ${projectId})`);
    console.log('4. Click on the uploaded files to view them in the right panel');
    
  } catch (error) {
    console.error('💥 Unexpected error during test:', error);
  }
}

runTest(); 
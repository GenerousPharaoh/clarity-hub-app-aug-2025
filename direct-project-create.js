// Script to directly create a project using user authentication
import { createClient } from '@supabase/supabase-js';
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

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createProjectAndUploadFile() {
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
    
    // Try inserting a project directly as the authenticated user
    const projectName = 'Test Project ' + new Date().toISOString().split('T')[0];
    
    // First, let's check the structure of the projects table
    console.log('Checking projects table structure...');
    
    // Simplified project creation - fewer fields to avoid schema issues
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          name: projectName,
          owner_id: signInData.user.id
        }
      ])
      .select();
    
    if (projectError) {
      console.error('Error creating project:', projectError.message);
      
      // If that failed, try a different approach with only the required fields
      console.log('Trying alternative approach...');
      
      // Let's check what columns are available in the projects table
      const { data: projectStructure, error: structureError } = await supabase.rpc('get_table_structure', { table_name: 'projects' });
      
      if (structureError) {
        console.error('Could not fetch table structure:', structureError.message);
        console.log('Attempting insertion with bare minimum fields...');
        
        // Try with only name field
        const { data: minimalProjectData, error: minimalError } = await supabase
          .from('projects')
          .insert([{ name: projectName }])
          .select();
        
        if (minimalError) {
          console.error('Still failed to create project:', minimalError.message);
          return;
        } else {
          console.log('Project created with minimal fields:', minimalProjectData[0]);
          projectData = minimalProjectData;
        }
      } else {
        console.log('Projects table structure:', projectStructure);
        return;
      }
    } else {
      console.log('Project created successfully:', projectData[0]);
    }
    
    // Now try to create the files bucket if it doesn't exist
    console.log('\nSetting up files bucket...');
    
    try {
      const { error: createBucketError } = await supabase.storage.createBucket('files', {
        public: true
      });
      
      if (createBucketError) {
        if (createBucketError.message.includes('already exists')) {
          console.log('Files bucket already exists.');
        } else {
          console.error('Error creating files bucket:', createBucketError.message);
        }
      } else {
        console.log('Files bucket created successfully');
      }
    } catch (error) {
      console.error('Error with bucket creation:', error);
    }
    
    console.log('\nSetup complete!');
    console.log('Project ID:', projectData?.[0]?.id || 'Unknown');
    console.log('Please refresh your application and try uploading files to the new project.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createProjectAndUploadFile(); 
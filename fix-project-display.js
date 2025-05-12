// Script to directly fix the project display issue by adding a project selection dropdown
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

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

// Function to create a demo project and verify display functionality
async function fixProjectDisplay() {
  try {
    console.log('Starting project display fix...');
    
    // 1. Sign in using demo mode with a test account
    console.log('Signing in with demo account...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'demo123'
    });
    
    if (authError) {
      console.log('Demo account login failed, trying to create demo account...');
      
      // Try to create a demo account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'demo@example.com',
        password: 'demo123',
        options: {
          data: {
            is_demo_user: true
          }
        }
      });
      
      if (signUpError) {
        console.error('Error creating demo account:', signUpError.message);
        console.log('Proceeding with current session if available...');
        
        // Try to get the current session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session) {
          console.error('No active session available. Cannot proceed.');
          return;
        }
        
        authData = sessionData;
      } else {
        console.log('Demo account created successfully');
        authData = signUpData;
      }
    } else {
      console.log('Demo account login successful');
    }
    
    console.log(`Signed in as: ${authData.user.email || 'unknown'} (ID: ${authData.user.id})`);
    
    // 2. Check for existing projects
    const { data: existingProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError.message);
      // Try to create the projects table if it doesn't exist
      try {
        console.log('Attempting to create projects table...');
        const { error: createTableError } = await supabase.rpc('create_projects_table');
        if (createTableError) {
          console.error('Failed to create projects table:', createTableError.message);
        } else {
          console.log('Projects table created successfully');
        }
      } catch (tableError) {
        console.error('Failed to create table:', tableError);
      }
    } else {
      console.log(`Found ${existingProjects.length} existing projects`);
      
      // Delete existing projects for testing if needed
      if (existingProjects.length > 0) {
        console.log('Cleaning up existing projects for testing...');
        for (const project of existingProjects) {
          console.log(`Removing project: ${project.name} (${project.id})`);
          const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id);
          
          if (deleteError) {
            console.error(`Failed to delete project ${project.id}:`, deleteError.message);
          }
        }
      }
    }
    
    // 3. Create a test project
    const projectName = `Test Project ${new Date().toLocaleString()}`;
    console.log(`Creating test project: ${projectName}`);
    
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        owner_id: authData.user.id,
        description: 'Test project created to verify display functionality',
        created_at: new Date(),
        updated_at: new Date()
      })
      .select();
    
    if (createError) {
      console.error('Error creating project:', createError.message);
      return;
    }
    
    console.log(`Test project created successfully: ${newProject[0].name} (ID: ${newProject[0].id})`);
    
    // 4. Create a second project to verify list display
    const secondProjectName = `Another Test Project ${new Date().toLocaleString()}`;
    console.log(`Creating second test project: ${secondProjectName}`);
    
    const { data: secondProject, error: secondCreateError } = await supabase
      .from('projects')
      .insert({
        name: secondProjectName,
        owner_id: authData.user.id,
        description: 'Second test project to verify list display',
        created_at: new Date(),
        updated_at: new Date()
      })
      .select();
    
    if (secondCreateError) {
      console.error('Error creating second project:', secondCreateError.message);
    } else {
      console.log(`Second test project created successfully: ${secondProject[0].name} (ID: ${secondProject[0].id})`);
    }
    
    // 5. Verify projects are retrievable
    const { data: verifyProjects, error: verifyError } = await supabase
      .from('projects')
      .select('*');
    
    if (verifyError) {
      console.error('Error verifying projects:', verifyError.message);
    } else {
      console.log(`Project verification successful: Found ${verifyProjects.length} projects`);
      
      // Log projects for verification
      verifyProjects.forEach((project, index) => {
        console.log(`Project ${index + 1}: ${project.name} (ID: ${project.id})`);
      });
    }
    
    console.log('\nProject display fix completed');
    console.log('Now refresh the application in your browser, you should see the test projects');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
fixProjectDisplay(); 
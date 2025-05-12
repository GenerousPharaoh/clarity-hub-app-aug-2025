// Script to create a test project directly in Supabase
// Run with: node create-test-project.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from the .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to create a test project
async function createTestProject() {
  try {
    console.log('Creating test project...');
    
    // Get user ID from email (needed for project creation)
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
      perPage: 100
    });
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    const user = userData.users.find(u => u.email === 'kareem.hassanein@gmail.com');
    
    if (!user) {
      console.error('User not found. Make sure the user exists in Supabase.');
      return;
    }
    
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    
    // Insert project into database
    const { data, error } = await supabase
      .from('projects')
      .insert([
        { 
          name: 'Test Project', 
          description: 'A test project for file upload testing',
          owner_id: user.id,
          created_at: new Date().toISOString(),
          status: 'active',
          team_members: [user.id],
          settings: {
            default_view: 'files',
            theme: 'light'
          }
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating project:', error);
    } else {
      console.log('Project created successfully:', data);
      console.log('\nYou can now refresh the app to see and select this project.');
    }
  } catch (error) {
    console.error('Exception creating project:', error);
  }
}

// Run the function
createTestProject(); 
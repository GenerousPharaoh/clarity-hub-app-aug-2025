import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Admin credentials
const ADMIN_EMAIL = 'kareem.hassanein@gmail.com';
const ADMIN_PASSWORD = 'Kingtut11-';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment variables:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdminAccount() {
  console.log('Setting up admin account using direct signup...');
  
  try {
    // Create admin user directly
    console.log(`Attempting to create admin user: ${ADMIN_EMAIL}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: {
          is_admin: true,
          full_name: 'Admin User'
        }
      }
    });
    
    if (signUpError) {
      console.error('Error creating admin user:', signUpError.message);
      
      // Try to sign in with admin credentials
      console.log('Attempting to sign in with admin credentials...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      
      if (signInError) {
        console.error('Error signing in with admin credentials:', signInError.message);
      } else {
        console.log('Successfully signed in with admin credentials:', signInData.user?.id);
        
        // Update user metadata if login was successful
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          data: {
            is_admin: true,
            full_name: 'Admin User'
          }
        });
        
        if (updateError) {
          console.error('Error updating user metadata:', updateError.message);
        } else {
          console.log('Successfully updated user metadata:', updateData.user.user_metadata);
        }
      }
    } else {
      console.log('Admin user created successfully:', signUpData.user?.id);
    }
    
    console.log('✅ Admin account setup completed!');
    
    // Verify if we can get the session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError.message);
    } else if (sessionData.session) {
      console.log('Current session:', sessionData.session.user?.id);
    } else {
      console.log('No active session.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the setup
setupAdminAccount(); 
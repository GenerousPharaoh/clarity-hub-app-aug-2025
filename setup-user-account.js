import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUserAccount() {
  console.log('🔧 Setting up real user account...');
  
  const userEmail = 'kareem.hassanein@gmail.com';
  
  // Check if user already exists
  console.log(`Checking if user ${userEmail} already exists...`);
  
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 100
    });
    
    if (error) {
      throw error;
    }
    
    const existingUser = data.users.find(user => user.email === userEmail);
    
    if (existingUser) {
      console.log(`✅ User ${userEmail} already exists with ID: ${existingUser.id}`);
      
      // Check if the user has admin privileges
      const { data: roleData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', existingUser.id)
        .single();
      
      if (roleError) {
        console.log(`Error checking user role: ${roleError.message}`);
      } else if (roleData) {
        console.log(`User current role: ${roleData.role || 'No role set'}`);
        
        // Update to admin role if not already
        if (roleData.role !== 'admin') {
          console.log('Updating user to admin role...');
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', existingUser.id);
          
          if (updateError) {
            console.error(`Error updating user role: ${updateError.message}`);
          } else {
            console.log('✅ User role updated to admin');
          }
        }
      } else {
        console.log('User profile not found, creating one...');
        
        // Create profile with admin role
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: existingUser.id,
            role: 'admin',
            first_name: 'Kareem',
            last_name: 'Hassanein'
          });
        
        if (insertError) {
          console.error(`Error creating profile: ${insertError.message}`);
        } else {
          console.log('✅ User profile created with admin role');
        }
      }
    } else {
      // Create the user if it doesn't exist
      console.log(`User ${userEmail} not found. Creating new user...`);
      
      // For security, we'll generate a temporary random password
      // The user can reset it later
      const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2) + '!1';
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: 'Kareem Hassanein',
        },
        app_metadata: {
          role: 'admin'
        }
      });
      
      if (createError) {
        console.error(`Error creating user: ${createError.message}`);
      } else {
        console.log(`✅ User created with ID: ${newUser.user.id}`);
        console.log(`Temporary password: ${tempPassword}`);
        console.log('Please store this password and provide it to the user.');
        
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUser.user.id,
            role: 'admin',
            first_name: 'Kareem',
            last_name: 'Hassanein'
          });
        
        if (profileError) {
          console.error(`Error creating profile: ${profileError.message}`);
        } else {
          console.log('✅ User profile created with admin role');
        }
      }
    }
    
    // Generate a password reset link
    console.log('\nGenerating password reset link...');
    
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
    });
    
    if (resetError) {
      console.error(`Error generating reset link: ${resetError.message}`);
    } else if (resetData) {
      console.log('✅ Password reset link generated:');
      console.log(resetData.properties.action_link);
      console.log('\nThis link can be used to set a new password.');
    }
    
  } catch (error) {
    console.error('Error setting up user account:', error);
  }
  
  console.log('\nUser account setup complete. You can now log in with the real account.');
}

setupUserAccount()
  .catch(error => {
    console.error('❌ Error setting up user account:', error);
    process.exit(1);
  }); 
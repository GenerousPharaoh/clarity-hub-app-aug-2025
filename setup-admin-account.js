import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Admin credentials
const ADMIN_EMAIL = 'kareem.hassanein@gmail.com';
const ADMIN_PASSWORD = 'Kingtut11-';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminAccount() {
  console.log('Setting up admin account...');
  
  try {
    // Check if admin user already exists using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing users with auth API:', authError.message);
    } else {
      console.log(`Found ${authData.users.length} users in the system.`);
      
      const adminUser = authData.users.find(u => u.email === ADMIN_EMAIL);
      
      if (adminUser) {
        console.log('Admin user already exists in auth system:', adminUser.id);
        
        // Update user metadata to include admin flag
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
          user_metadata: { 
            ...adminUser.user_metadata,
            is_admin: true,
            full_name: 'Admin User'
          }
        });
        
        if (updateError) {
          console.error('Error updating admin user metadata:', updateError.message);
        } else {
          console.log('Updated admin user metadata successfully:', updateData);
        }
        
        return;
      }
    }
    
    // Create admin user if it doesn't exist
    console.log('Admin user not found. Creating admin user...');
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        is_admin: true,
        full_name: 'Admin User'
      }
    });
    
    if (createError) {
      console.error('Error creating admin user:', createError.message);
      
      // Try regular sign-up as fallback
      console.log('Attempting regular sign-up as fallback...');
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
        console.error('Fallback sign-up failed:', signUpError.message);
        return;
      }
      
      console.log('Admin user created successfully via fallback method.');
    } else {
      console.log('Admin user created successfully:', newUser);
    }
    
    // Set up RLS policies for admin user
    try {
      // Check if exec_sql function exists
      const { data: funcData, error: funcError } = await supabase.rpc('exec_sql', { 
        sql: "SELECT 1" 
      });
      
      if (funcError) {
        console.error('Error: exec_sql function does not exist or is not accessible.');
        console.log('Skipping SQL policy creation.');
      } else {
        console.log('Setting up RLS policies for admin access...');
        
        // Add SQL policies for admin
        const sqlStatements = [
          // Add admin policy to projects table
          `CREATE POLICY IF NOT EXISTS "Admin full access to projects" 
           ON public.projects FOR ALL 
           TO authenticated 
           USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = '${ADMIN_EMAIL}'))
           WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email = '${ADMIN_EMAIL}'))`,
          
          // Add admin policy to files table
          `CREATE POLICY IF NOT EXISTS "Admin full access to files" 
           ON public.files FOR ALL 
           TO authenticated 
           USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = '${ADMIN_EMAIL}'))
           WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email = '${ADMIN_EMAIL}'))`,
          
          // Add admin policy to storage objects
          `CREATE POLICY IF NOT EXISTS "Admin full access to storage" 
           ON storage.objects FOR ALL 
           TO authenticated 
           USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = '${ADMIN_EMAIL}'))
           WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email = '${ADMIN_EMAIL}'))`
        ];
        
        // Execute each SQL statement
        for (const sql of sqlStatements) {
          try {
            await supabase.rpc('exec_sql', { sql });
            console.log('SQL executed successfully:', sql.split('\n')[0].trim());
          } catch (sqlError) {
            console.error('Error executing SQL:', sqlError);
          }
        }
      }
    } catch (policyError) {
      console.error('Error setting up RLS policies:', policyError);
    }
    
    console.log('✅ Admin account setup completed successfully!');
  } catch (error) {
    console.error('Unexpected error setting up admin account:', error);
  }
}

// Run the setup
setupAdminAccount(); 
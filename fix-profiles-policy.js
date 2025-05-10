import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://swtkpfpyjjkkemmvkhmz.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTMwMzk1MiwiZXhwIjoyMDYwODc5OTUyfQ.F_7acnpuD3JTm7jvUbzplYOo0sV1nvpHCw5UZN87V3k';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// SQL statements to fix the profiles policy
const sql = `
-- Drop any existing policy that might be causing recursion
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create a simple policy to allow all authenticated users to view profiles
CREATE POLICY "Users can view all profiles" 
  ON profiles FOR SELECT
  USING (true);

-- Ensure the proper update policy exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
`;

// Apply the fix
async function fixProfilesPolicy() {
  try {
    console.log('Fixing profiles policy...');
    console.log('Running SQL:', sql);
    
    // Execute SQL directly using service role (admin) privileges
    const { error } = await supabase.rpc('pg_query', {
      query: sql
    });
    
    if (error) {
      console.error('Error fixing profiles policy:', error);
      process.exit(1);
    }
    
    console.log('Profiles policy fixed successfully!');
    
    // Test the fix
    console.log('Testing profiles table access...');
    const { data, error: testError } = await supabase.from('profiles').select('*').limit(1);
    
    if (testError) {
      console.error('Error testing profiles access:', testError);
    } else {
      console.log('Profiles access working correctly:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the fix
fixProfilesPolicy(); 
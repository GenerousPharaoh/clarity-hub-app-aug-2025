import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load all environment files
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.development' });

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Found' : 'Missing');
console.log('Supabase Service Key:', supabaseServiceKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env files.');
  process.exit(1);
}

// Output first and last few characters for verification without exposing full keys
console.log('URL (partial):', `${supabaseUrl.substring(0, 20)}...${supabaseUrl.substring(supabaseUrl.length - 5)}`);
console.log('Anon Key (partial):', `${supabaseAnonKey.substring(0, 5)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}`);
if (supabaseServiceKey) {
  console.log('Service Key (partial):', `${supabaseServiceKey.substring(0, 5)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 5)}`);
}

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Check if we can access the API
async function checkAccess() {
  try {
    console.log('\nChecking API access with anon key...');
    
    // Try a simple query that should always work
    const { data, error } = await supabase.from('_prisma_migrations').select('*', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error('❌ API access failed:', error.message);
    } else {
      console.log('✅ API access successful!');
      console.log(`Retrieved ${data.length} records.`);
    }
    
    // Try storage access
    console.log('\nChecking storage access with anon key...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Storage access failed:', storageError.message);
    } else {
      console.log('✅ Storage access successful!');
      console.log(`Found ${buckets.length} buckets:`, buckets.map(b => b.name).join(', '));
    }
    
    // Check service role if available
    if (serviceClient) {
      console.log('\nChecking API access with service role key...');
      
      const { data: srData, error: srError } = await serviceClient.from('_prisma_migrations').select('*', { count: 'exact' }).limit(1);
      
      if (srError) {
        console.error('❌ Service role API access failed:', srError.message);
      } else {
        console.log('✅ Service role API access successful!');
      }
      
      // Try storage access with service role
      console.log('\nChecking storage access with service role key...');
      const { data: srBuckets, error: srStorageError } = await serviceClient.storage.listBuckets();
      
      if (srStorageError) {
        console.error('❌ Service role storage access failed:', srStorageError.message);
      } else {
        console.log('✅ Service role storage access successful!');
        console.log(`Found ${srBuckets.length} buckets:`, srBuckets.map(b => b.name).join(', '));
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the checks
checkAccess().then(() => console.log('\nCredential check complete')); 
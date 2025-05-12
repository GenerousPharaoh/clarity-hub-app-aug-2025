import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file location for proper .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function checkStorage() {
  try {
    // Check if buckets exist
    console.log('Checking storage buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name).join(', '));
    
    // Check if required buckets exist
    const requiredBuckets = ['files', 'avatars', 'thumbnails'];
    const missingBuckets = requiredBuckets.filter(
      bucket => !buckets.some(b => b.name === bucket)
    );
    
    if (missingBuckets.length > 0) {
      console.log('Missing required buckets:', missingBuckets.join(', '));
      
      // Try to create missing buckets if we have service role key
      if (serviceClient) {
        console.log('Attempting to create missing buckets with service role...');
        
        for (const bucket of missingBuckets) {
          const { data, error } = await serviceClient.storage.createBucket(bucket, {
            public: bucket === 'files' || bucket === 'avatars'
          });
          
          if (error) {
            console.error(`Failed to create bucket ${bucket}:`, error.message);
          } else {
            console.log(`Created bucket ${bucket} successfully`);
          }
        }
      } else {
        console.log('No service role key available to create missing buckets.');
      }
    } else {
      console.log('All required buckets exist.');
    }
    
    // Check bucket permissions
    console.log('\nChecking bucket policies...');
    for (const bucket of buckets) {
      const { data: policy, error: policyError } = await supabase.storage.getBucket(bucket.name);
      
      if (policyError) {
        console.error(`Error getting policy for bucket ${bucket.name}:`, policyError.message);
        continue;
      }
      
      console.log(`Bucket ${bucket.name}: ${policy.public ? 'public' : 'private'}`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkStorage().then(() => console.log('Storage check complete')); 
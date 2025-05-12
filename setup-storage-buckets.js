import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env file.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Required buckets with their public status
const requiredBuckets = [
  { name: 'files', public: true },
  { name: 'avatars', public: true },
  { name: 'thumbnails', public: true }
];

async function ensureStorageBuckets() {
  console.log('Ensuring storage buckets exist with correct permissions...');
  
  try {
    // Get existing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name).join(', '));
    
    // Create missing buckets
    for (const bucket of requiredBuckets) {
      const exists = buckets.some(b => b.name === bucket.name);
      
      if (!exists) {
        console.log(`Creating bucket: ${bucket.name} (public: ${bucket.public})`);
        
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public
        });
        
        if (error) {
          console.error(`Error creating bucket ${bucket.name}:`, error.message);
        } else {
          console.log(`Successfully created bucket: ${bucket.name}`);
        }
      } else {
        console.log(`Bucket ${bucket.name} already exists, updating permissions...`);
        
        // Update bucket to ensure correct permissions
        const { error: updateError } = await supabase.storage.updateBucket(bucket.name, {
          public: bucket.public
        });
        
        if (updateError) {
          console.error(`Error updating bucket ${bucket.name}:`, updateError.message);
        } else {
          console.log(`Successfully updated bucket: ${bucket.name}`);
        }
      }
    }
    
    console.log('Storage bucket setup complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
ensureStorageBuckets().catch(error => {
  console.error('Failed to setup storage buckets:', error);
}); 
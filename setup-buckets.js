import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from various dotenv files
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.development' });

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key (first 10 chars):', supabaseAnonKey.substring(0, 10));

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define required buckets
const REQUIRED_BUCKETS = [
  { name: 'files', public: true },
  { name: 'avatars', public: true },
  { name: 'thumbnails', public: true }
];

async function setupBuckets() {
  try {
    // First, authenticate as a known user
    console.log('\nAuthenticating as kareem.hassanein@gmail.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kareem.hassanein@gmail.com',
      password: 'Kingtut11-'
    });

    if (authError) {
      console.error('Authentication failed:', authError);
      return;
    }

    console.log('Authentication successful!');
    console.log('User ID:', authData.user.id);

    // Check existing buckets
    console.log('\nChecking existing storage buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      
      // Try to create a bucket directly
      console.log('Attempting to create storage buckets directly...');
    } else {
      console.log('Existing buckets:', buckets.map(b => b.name).join(', ') || 'None');
    }

    // Create any missing buckets
    for (const bucket of REQUIRED_BUCKETS) {
      console.log(`\nSetting up bucket: ${bucket.name} (public: ${bucket.public})`);
      
      try {
        // Try to create the bucket
        const { error: createError } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public
        });
        
        if (createError) {
          if (createError.message.includes('already exists')) {
            console.log(`Bucket ${bucket.name} already exists, updating permissions...`);
            
            // Update bucket permissions
            const { error: updateError } = await supabase.storage.updateBucket(bucket.name, {
              public: bucket.public
            });
            
            if (updateError) {
              console.error(`Error updating ${bucket.name}:`, updateError);
            } else {
              console.log(`✅ Updated permissions for ${bucket.name}`);
            }
          } else {
            console.error(`Error creating bucket ${bucket.name}:`, createError);
          }
        } else {
          console.log(`✅ Successfully created bucket: ${bucket.name}`);
        }
        
        // Create a test file in the bucket
        const testContent = 'This is a test file';
        const testPath = `test/setup-verification-${Date.now()}.txt`;
        
        console.log(`Creating test file in ${bucket.name}...`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket.name)
          .upload(testPath, new Blob([testContent], { type: 'text/plain' }), {
            contentType: 'text/plain',
            upsert: true
          });
          
        if (uploadError) {
          console.error(`Error uploading test file to ${bucket.name}:`, uploadError);
        } else {
          console.log(`✅ Test file uploaded: ${uploadData.path}`);
          
          // Try to generate a public URL
          const { data: urlData } = supabase.storage.from(bucket.name).getPublicUrl(uploadData.path);
          console.log(`Public URL: ${urlData.publicUrl}`);
        }
      } catch (error) {
        console.error(`Unexpected error with bucket ${bucket.name}:`, error);
      }
    }
    
    console.log('\nStorage setup complete! The application should now be able to upload files.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the setup
setupBuckets(); 
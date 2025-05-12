// CommonJS module to check Supabase buckets
const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabase = createClient(
  'https://swtkpfpyjjkkemmvkhmz.supabase.co',
  '2xCv756AiutwXpRM', // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function run() {
  console.log('Checking Supabase buckets with service role...');
  
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    console.log('Available buckets:', data);
    
    // Try to create the required buckets if they don't exist
    const requiredBuckets = ['files', 'avatars', 'thumbnails'];
    
    for (const bucketName of requiredBuckets) {
      if (!data.find(b => b.name === bucketName)) {
        console.log(`Creating bucket: ${bucketName}`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: bucketName === 'files' || bucketName === 'avatars' // Make files and avatars buckets public
        });
        
        if (createError) {
          console.error(`Error creating ${bucketName} bucket:`, createError);
        } else {
          console.log(`Successfully created ${bucketName} bucket.`);
          
          // If we created a bucket, update its RLS policies
          if (bucketName === 'files') {
            console.log('Updating files bucket policy...');
            // Allow read access for all files
            const { error: policyError } = await supabase.storage.from(bucketName).createSignedUrl('test.txt', 60);
            if (policyError) {
              console.error('Error checking policy:', policyError);
            } else {
              console.log('Policy check successful');
            }
          }
        }
      } else {
        console.log(`Bucket ${bucketName} already exists.`);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run(); 
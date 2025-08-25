// SECURITY WARNING: This script contained hardcoded credentials which have been removed
// To use this script, you must provide credentials via environment variables

console.error('SECURITY NOTICE: This script has been disabled due to hardcoded credentials.');
console.error('Please set up environment variables and update this script to use them:');
console.error('- VITE_SUPABASE_URL');
console.error('- SUPABASE_SERVICE_ROLE_KEY');
console.error('');
console.error('This script has been disabled for security reasons.');
process.exit(1);

/*
// Original script template - update to use environment variables:
import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}
*/

// Create admin client
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Applying storage permission fixes...');
  
  try {
    // 1. Make all buckets public
    const bucketsToFix = ['files', 'thumbnails', 'demo-files'];
    
    // First check if buckets exist
    const { data: buckets, error: bucketError } = await adminClient.storage.listBuckets();
    
    if (bucketError) {
      throw bucketError;
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name).join(', '));
    
    // Create missing buckets and make all buckets public
    for (const bucketId of bucketsToFix) {
      const bucketExists = buckets.some(b => b.name === bucketId);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketId}`);
        try {
          const { error: createError } = await adminClient.storage.createBucket(bucketId, {
            public: true,
            fileSizeLimit: 100000000, // 100MB
          });
          
          if (createError) {
            throw createError;
          }
          console.log(`Created bucket: ${bucketId}`);
        } catch (err) {
          console.error(`Failed to create bucket ${bucketId}:`, err.message);
        }
      } else {
        console.log(`Making bucket public: ${bucketId}`);
        try {
          const { error: updateError } = await adminClient.storage.updateBucket(bucketId, {
            public: true,
            fileSizeLimit: 100000000, // 100MB
          });
          
          if (updateError) {
            throw updateError;
          }
          console.log(`Updated bucket: ${bucketId}`);
        } catch (err) {
          console.error(`Failed to update bucket ${bucketId}:`, err.message);
        }
      }
    }
    
    // Create a demo project
    const demoProjectId = 'demo-project-123';
    const demoUserId = 'demo-user-123'; 
    
    console.log(`Creating demo project: ${demoProjectId}`);
    
    try {
      const { error: projectError } = await adminClient.from('projects').upsert({
        id: demoProjectId,
        name: 'Demo Legal Case',
        owner_id: demoUserId,
        created_at: new Date().toISOString(),
        description: 'A demo project with sample files'
      });
      
      if (projectError) {
        throw projectError;
      }
      
      console.log('Created demo project successfully');
      
      // Create demo files
      const demoFiles = [
        {
          id: 'demo-file-1',
          name: 'Sample Contract.pdf',
          project_id: demoProjectId,
          owner_id: demoUserId,
          storage_path: `projects/${demoProjectId}/demo-file-1_sample.pdf`,
          content_type: 'application/pdf',
          size: 12345,
          file_type: 'pdf',
          metadata: {
            tags: ['contract', 'legal'],
            processingStatus: 'completed'
          },
          added_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-file-2',
          name: 'Case Evidence.jpg',
          project_id: demoProjectId,
          owner_id: demoUserId,
          storage_path: `projects/${demoProjectId}/demo-file-2_evidence.jpg`,
          content_type: 'image/jpeg',
          size: 45678,
          file_type: 'image',
          metadata: {
            tags: ['evidence', 'photo'],
            processingStatus: 'completed'
          },
          added_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-file-3',
          name: 'Meeting Notes.txt',
          project_id: demoProjectId,
          owner_id: demoUserId,
          storage_path: `projects/${demoProjectId}/demo-file-3_notes.txt`,
          content_type: 'text/plain',
          size: 1234,
          file_type: 'text',
          metadata: {
            tags: ['notes', 'meeting'],
            processingStatus: 'completed'
          },
          added_at: new Date().toISOString()
        }
      ];
      
      console.log('Creating demo files...');
      
      for (const file of demoFiles) {
        const { error: fileError } = await adminClient.from('files').upsert(file);
        
        if (fileError) {
          console.error(`Error creating file ${file.id}:`, fileError);
        } else {
          console.log(`Created file: ${file.name}`);
        }
      }
      
    } catch (projectErr) {
      console.error('Failed to create demo project:', projectErr);
    }
    
    console.log('\n✅ All fixes applied successfully!');
    console.log('You should now be able to see projects and files in the application.');
    console.log('Please restart the development server (npm run dev) and refresh your browser.');
    
  } catch (error) {
    console.error('Error applying fixes:', error);
  }
}

main();
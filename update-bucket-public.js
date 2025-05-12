/**
 * This script updates the 'files' bucket to be publicly accessible
 * This is necessary to make direct URL access work properly
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
  process.exit(1);
}

// Create client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateBucketSettings() {
  console.log('Updating bucket settings...');
  
  try {
    // First, check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return;
    }
    
    const filesBucket = buckets.find(b => b.name === 'files');
    
    if (!filesBucket) {
      console.log('Files bucket does not exist yet. Creating it...');
      
      // Create the files bucket as public
      const { data, error } = await supabase.storage.createBucket('files', {
        public: true
      });
      
      if (error) {
        console.error('Failed to create files bucket:', error.message);
      } else {
        console.log('Successfully created public files bucket');
      }
    } else {
      console.log('Files bucket exists. Updating public setting...');
      
      // Update existing bucket to be public
      const { data, error } = await supabase.storage.updateBucket('files', {
        public: true
      });
      
      if (error) {
        console.error('Failed to update files bucket:', error.message);
      } else {
        console.log('Successfully updated files bucket to be public');
      }
    }
    
    // Double-check the bucket is now public
    const { data: updatedBuckets, error: checkError } = await supabase.storage.listBuckets();
    
    if (checkError) {
      console.error('Error checking bucket status:', checkError.message);
      return;
    }
    
    const updatedFilesBucket = updatedBuckets.find(b => b.name === 'files');
    
    if (updatedFilesBucket) {
      console.log(`Bucket 'files' public status: ${updatedFilesBucket.public}`);
    } else {
      console.error('Could not find files bucket after update');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

updateBucketSettings(); 
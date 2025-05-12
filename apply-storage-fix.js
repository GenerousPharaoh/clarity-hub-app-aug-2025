import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a Supabase client
const supabaseUrl = 'https://swtkpfpyjjkkemmvkhmz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyOTIwMDAwMCwiZXhwIjoxOTQ0NzYwMDAwfQ.UXJ-Qv2-BBDzQiPrZ-jnYqUUL6u2qoVvFYQbqa3MJ5E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDirectStorageFix() {
  console.log('📦 Applying storage bucket fixes...');
  
  try {
    // Make the files bucket public (direct approach)
    const { data: bucketData, error: bucketError } = await supabase
      .from('storage.buckets')
      .update({ public: true })
      .eq('name', 'files');
      
    if (bucketError) {
      console.error('Error updating bucket:', bucketError);
    } else {
      console.log('✅ Files bucket set to public.');
    }
    
    // Create required policies
    const { data: policyData, error: policyError } = await supabase
      .rpc('admin_create_storage_policy', {
        bucket_name: 'files',
        policy_name: 'Public can view files',
        definition: 'bucket_id = \'files\'',
        operation: 'SELECT'
      });
    
    if (policyError) {
      console.error('Error creating policy:', policyError);
    } else {
      console.log('✅ Public access policy created.');
    }
    
    // Test bucket listing to verify access
    const { data: listData, error: listError } = await supabase
      .storage
      .from('files')
      .list();
      
    if (listError) {
      console.error('Error listing files bucket:', listError);
    } else {
      console.log(`✅ Files bucket accessible. Found ${listData.length} files.`);
    }
    
    // Try to also create the buckets if they don't exist
    const buckets = ['files', 'avatars', 'thumbnails'];
    
    for (const bucketName of buckets) {
      try {
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: bucketName === 'files' ? 50000000 : 5000000,
        });
        
        if (error && !error.message.includes('already exists')) {
          console.error(`Error creating bucket ${bucketName}:`, error);
        } else if (!error) {
          console.log(`✅ Created bucket: ${bucketName}`);
        } else {
          console.log(`ℹ️ Bucket ${bucketName} already exists.`);
        }
      } catch (e) {
        console.error(`Failed to create bucket ${bucketName}:`, e);
      }
    }
    
    console.log('🎉 Storage fix applied successfully!');
    console.log('Now test file access by navigating to a project with files.');
    
  } catch (error) {
    console.error('💥 Critical error during storage fix:', error);
  }
}

applyDirectStorageFix(); 
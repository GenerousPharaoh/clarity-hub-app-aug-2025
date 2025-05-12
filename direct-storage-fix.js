import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a Supabase client with hardcoded keys to ensure it works
const supabaseUrl = 'https://swtkpfpyjjkkemmvkhmz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNjE1NTE4MSwiZXhwIjoyMDMxNzMxNTgxfQ.WzQXhdHlFiQtcwSfSjYYg_L25hHIj5zJtYCGM3_y42g';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to check if a file is accessible
async function checkFileAccess(fileUrl) {
  try {
    const response = await fetch(fileUrl, { method: 'HEAD' });
    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers)
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Main function
async function fixStorage() {
  console.log('🔧 Applying direct storage fixes for file access...');
  
  // Step 1: Try to make bucket public
  try {
    console.log('Making files bucket public...');
    
    // First approach: Update buckets table directly
    try {
      const { data: bucketData, error: bucketError } = await supabase
        .from('storage.buckets')
        .update({ public: true })
        .eq('name', 'files');
      
      if (bucketError) {
        console.error('Error updating bucket:', bucketError);
      } else {
        console.log('✅ Bucket updated to be public');
      }
    } catch (e) {
      console.error('Error updating bucket directly:', e);
    }
    
    // Second approach: Try REST API directly
    try {
      const directResponse = await fetch(`${supabaseUrl}/rest/v1/storage.buckets?name=eq.files`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ public: true })
      });
      
      if (directResponse.ok) {
        console.log('✅ Bucket updated via REST API');
      } else {
        console.error('Error updating bucket via REST API:', await directResponse.text());
      }
    } catch (e) {
      console.error('Error making direct API call:', e);
    }
    
    // Check current files in the bucket
    console.log('\nChecking files in the bucket...');
    
    const { data: files, error: filesError } = await supabase
      .storage
      .from('files')
      .list();
    
    if (filesError) {
      console.error('Error listing files:', filesError);
    } else {
      console.log(`Found ${files.length} files in the bucket`);
      
      // Sample the first few files for access testing
      const sampleFiles = files.slice(0, 3);
      
      for (const file of sampleFiles) {
        const { data: urlData } = supabase.storage.from('files').getPublicUrl(file.name);
        
        console.log(`Testing access for: ${file.name}`);
        console.log(`Public URL: ${urlData.publicUrl}`);
        
        const accessResult = await checkFileAccess(urlData.publicUrl);
        console.log('Access check result:', accessResult);
        
        // If file is not accessible, test with signed URL
        if (!accessResult.ok) {
          console.log('Testing with signed URL...');
          const { data: signedUrlData, error: signedError } = await supabase.storage
            .from('files')
            .createSignedUrl(file.name, 60);
            
          if (signedError) {
            console.error('Error creating signed URL:', signedError);
          } else {
            console.log(`Signed URL: ${signedUrlData.signedUrl}`);
            const signedAccessResult = await checkFileAccess(signedUrlData.signedUrl);
            console.log('Signed URL access check result:', signedAccessResult);
          }
        }
      }
    }
    
    // Check if we can update the direct URL construction in the app
    console.log('\nChecking direct URL construction...');
    const projectId = 'swtkpfpyjjkkemmvkhmz';
    
    if (files && files.length > 0) {
      const testFile = files[0];
      const directUrl = `https://${projectId}.supabase.co/storage/v1/object/public/files/${testFile.name}`;
      console.log(`Direct URL: ${directUrl}`);
      
      const directAccessResult = await checkFileAccess(directUrl);
      console.log('Direct URL access check result:', directAccessResult);
    }
    
    // Add a public policy
    console.log('\nAdding public access policy...');
    
    // Method 1: Try RPC
    try {
      const { data: policyData, error: policyError } = await supabase
        .rpc('admin_create_storage_policy', {
          bucket_name: 'files',
          policy_name: 'Public can view files',
          definition: 'bucket_id = \'files\'',
          operation: 'SELECT'
        });
        
      if (policyError) {
        console.error('Error creating policy via RPC:', policyError);
      } else {
        console.log('✅ Public policy created via RPC');
      }
    } catch (e) {
      console.error('Error calling RPC:', e);
    }
    
    // Method 2: Direct SQL
    try {
      const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
          CREATE POLICY "Public can view files" ON storage.objects
          FOR SELECT
          USING (bucket_id = 'files');
        `
      });
      
      if (sqlError) {
        console.error('Error executing SQL:', sqlError);
      } else {
        console.log('✅ Public policy created via SQL');
      }
    } catch (e) {
      console.error('Error executing SQL directly:', e);
    }
    
    // Final check
    console.log('\n📊 Storage setup summary:');
    console.log('1. Attempted to make files bucket public');
    console.log('2. Attempted to add public access policy');
    console.log('3. Checked file access via different URL methods');
    
    console.log('\n⚠️ Note: If direct file access is still not working in the app:');
    console.log('- Make sure storageService.ts is using the direct URL construction');
    console.log('- Check browser console for CORS errors');
    console.log('- Check Network tab to see which URLs are failing');
    console.log('- Try clearing browser cache or using incognito mode');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixStorage(); 
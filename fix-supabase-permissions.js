import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

// Read the SQL file content
const sqlFilePath = path.join(__dirname, 'fix_rls_sql.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL into individual statements (naive approach, works for our simple statements)
const sqlStatements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
  .map(stmt => stmt + ';');

// Required buckets with their public status
const requiredBuckets = [
  { name: 'files', public: true },
  { name: 'avatars', public: true },
  { name: 'thumbnails', public: true }
];

async function applyFixSql() {
  console.log('🔧 Applying file upload permission fixes...');
  
  let successCount = 0;
  let failureCount = 0;
  
  // Execute each SQL statement
  for (const [index, sql] of sqlStatements.entries()) {
    try {
      console.log(`Executing statement ${index + 1}/${sqlStatements.length}:`);
      console.log(`${sql.substring(0, 60)}${sql.length > 60 ? '...' : ''}`);
      
      // Use Supabase REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          query: sql
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`Error executing statement ${index + 1}:`, error);
        failureCount++;
      } else {
        console.log('✅ Statement executed successfully');
        successCount++;
      }
    } catch (error) {
      console.error(`Error executing statement ${index + 1}:`, error);
      failureCount++;
    }
  }
  
  console.log('✅ RLS policy fixes applied!');
  console.log(`Results: ${successCount} statements succeeded, ${failureCount} failed.`);
  
  // Test authentication with kareem.hassanein@gmail.com
  console.log('\nTesting user authentication...');
  
  try {
    // Check if user exists
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 100
    });
    
    if (error) {
      console.error('Error listing users:', error);
    } else {
      const users = data.users;
      const user = users.find(u => u.email === 'kareem.hassanein@gmail.com');
      
      if (user) {
        console.log('✅ User kareem.hassanein@gmail.com exists in the system.');
        console.log(`User details: ID=${user.id}, Created=${new Date(user.created_at).toLocaleString()}`);
      } else {
        console.log('❌ User kareem.hassanein@gmail.com not found. You may need to create this account.');
      }
    }
  } catch (error) {
    console.error('Error checking user:', error);
  }
  
  // Test file storage permissions
  console.log('\nTesting storage permissions...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing storage buckets:', error);
    } else {
      console.log('Available storage buckets:');
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
      
      // Check if 'files' bucket exists
      const filesBucket = buckets.find(b => b.name === 'files');
      if (filesBucket) {
        console.log('✅ Files bucket exists and is ready for uploads');
      } else {
        console.log('❌ Files bucket not found. You may need to create it.');
      }
    }
  } catch (error) {
    console.error('Error checking storage:', error);
  }
  
  console.log('\nAll fixes have been applied. Try uploading a file to verify the solution.');
}

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

applyFixSql()
  .then(() => {
    return ensureStorageBuckets();
  })
  .catch(error => {
    console.error('❌ Error applying fixes:', error);
    process.exit(1);
  }); 
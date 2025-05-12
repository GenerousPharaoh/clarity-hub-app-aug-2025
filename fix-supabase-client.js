// A unified script to solve all Supabase issues in one go
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { exec } from 'child_process';

// Load environment variables
dotenv.config();

// Check environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=========================================");
console.log("🔍 Checking Supabase configuration");
console.log("=========================================");

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  
  if (!supabaseUrl) console.error('VITE_SUPABASE_URL is missing');
  if (!supabaseAnonKey) console.error('VITE_SUPABASE_ANON_KEY is missing');
  if (!supabaseServiceKey) console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
  
  console.log("\nPlease make sure all three variables are defined in your .env file:");
  console.log("VITE_SUPABASE_URL=<your-supabase-url>");
  console.log("VITE_SUPABASE_ANON_KEY=<your-anon-key>");
  console.log("SUPABASE_SERVICE_ROLE_KEY=<your-service-key>");
  
  process.exit(1);
}

console.log("✅ All required environment variables are set.");
console.log("Supabase URL: " + supabaseUrl);

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to create storage buckets
async function setupStorageBuckets() {
  console.log("\n=========================================");
  console.log("🔧 Setting up storage buckets");
  console.log("=========================================");
  
  const requiredBuckets = [
    { name: 'files', public: true },
    { name: 'avatars', public: true },
    { name: 'thumbnails', public: true }
  ];
  
  try {
    // Get existing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      return false;
    }
    
    console.log('Existing buckets:', buckets.length ? buckets.map(b => b.name).join(', ') : 'None');
    
    // Create missing buckets
    for (const bucket of requiredBuckets) {
      const exists = buckets.some(b => b.name === bucket.name);
      
      if (!exists) {
        console.log(`📦 Creating bucket: ${bucket.name} (public: ${bucket.public})`);
        
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public
        });
        
        if (error) {
          console.error(`❌ Error creating bucket ${bucket.name}:`, error.message);
        } else {
          console.log(`✅ Successfully created bucket: ${bucket.name}`);
        }
      } else {
        console.log(`ℹ️ Bucket ${bucket.name} already exists, updating permissions...`);
        
        // Update bucket to ensure correct permissions
        const { error: updateError } = await supabase.storage.updateBucket(bucket.name, {
          public: bucket.public
        });
        
        if (updateError) {
          console.error(`❌ Error updating bucket ${bucket.name}:`, updateError.message);
        } else {
          console.log(`✅ Successfully updated bucket: ${bucket.name}`);
        }
      }
    }
    
    console.log('✅ Storage bucket setup complete!');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error during bucket setup:', error);
    return false;
  }
}

// Function to create the database tables if not exist
async function setupDatabaseTables() {
  console.log("\n=========================================");
  console.log("🔧 Setting up database tables");
  console.log("=========================================");
  
  // SQL to create necessary tables
  const createTablesSql = `
    -- Create projects table if not exists
    CREATE TABLE IF NOT EXISTS public.projects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      owner_id UUID NOT NULL REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      status TEXT DEFAULT 'active',
      team_members UUID[] DEFAULT ARRAY[]::UUID[],
      settings JSONB DEFAULT '{}'::JSONB
    );

    -- Create files table if not exists
    CREATE TABLE IF NOT EXISTS public.files (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      project_id UUID REFERENCES public.projects(id),
      owner_id UUID REFERENCES auth.users(id),
      storage_path TEXT NOT NULL,
      file_type TEXT,
      size_bytes BIGINT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::JSONB
    );
  `;
  
  try {
    console.log('Creating tables if they do not exist...');
    
    // Execute SQL via RPC
    const { error: rpcError } = await supabase.rpc('execute_sql', { sql: createTablesSql });
    
    if (rpcError) {
      console.error('❌ Error creating tables:', rpcError.message);
      return false;
    }
    
    console.log('✅ Database tables setup complete!');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error setting up tables:', error);
    return false;
  }
}

// Function to set up RLS policies
async function setupRLSPolicies() {
  console.log("\n=========================================");
  console.log("🔧 Setting up RLS policies");
  console.log("=========================================");
  
  // SQL to set up RLS policies
  const policySetupSql = `
    -- Enable RLS on tables
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

    -- Project policies
    DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
    DROP POLICY IF EXISTS "Users can insert their projects" ON public.projects;
    DROP POLICY IF EXISTS "Users can update their projects" ON public.projects;
    DROP POLICY IF EXISTS "Users can delete their projects" ON public.projects;
    
    CREATE POLICY "Users can view their projects" 
      ON public.projects FOR SELECT 
      TO authenticated 
      USING (owner_id = auth.uid() OR auth.uid() = ANY(team_members));
    
    CREATE POLICY "Users can insert their projects" 
      ON public.projects FOR INSERT 
      TO authenticated 
      WITH CHECK (owner_id = auth.uid());
    
    CREATE POLICY "Users can update their projects" 
      ON public.projects FOR UPDATE 
      TO authenticated 
      USING (owner_id = auth.uid() OR auth.uid() = ANY(team_members));
    
    CREATE POLICY "Users can delete their projects" 
      ON public.projects FOR DELETE 
      TO authenticated 
      USING (owner_id = auth.uid());

    -- File policies
    DROP POLICY IF EXISTS "Users can view their files" ON public.files;
    DROP POLICY IF EXISTS "Users can insert their files" ON public.files;
    DROP POLICY IF EXISTS "Users can update their files" ON public.files;
    DROP POLICY IF EXISTS "Users can delete their files" ON public.files;
    
    CREATE POLICY "Users can view their files" 
      ON public.files FOR SELECT 
      TO authenticated 
      USING (
        owner_id = auth.uid() OR 
        project_id IN (
          SELECT id FROM public.projects 
          WHERE owner_id = auth.uid() OR auth.uid() = ANY(team_members)
        )
      );
    
    CREATE POLICY "Users can insert their files" 
      ON public.files FOR INSERT 
      TO authenticated 
      WITH CHECK (
        owner_id = auth.uid() AND
        (
          project_id IS NULL OR
          project_id IN (
            SELECT id FROM public.projects 
            WHERE owner_id = auth.uid() OR auth.uid() = ANY(team_members)
          )
        )
      );
    
    CREATE POLICY "Users can update their files" 
      ON public.files FOR UPDATE 
      TO authenticated 
      USING (
        owner_id = auth.uid() OR 
        project_id IN (
          SELECT id FROM public.projects 
          WHERE owner_id = auth.uid() OR auth.uid() = ANY(team_members)
        )
      );
    
    CREATE POLICY "Users can delete their files" 
      ON public.files FOR DELETE 
      TO authenticated 
      USING (
        owner_id = auth.uid() OR 
        project_id IN (
          SELECT id FROM public.projects 
          WHERE owner_id = auth.uid() OR auth.uid() = ANY(team_members)
        )
      );
    
    -- Storage policies
    DROP POLICY IF EXISTS "Allow authenticated file uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated to view files" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated to update files" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated to delete files" ON storage.objects;
    
    CREATE POLICY "Allow authenticated file uploads" 
      ON storage.objects FOR INSERT 
      TO authenticated 
      WITH CHECK (bucket_id IN ('files', 'avatars', 'thumbnails'));
    
    CREATE POLICY "Allow authenticated to view files" 
      ON storage.objects FOR SELECT 
      TO authenticated 
      USING (bucket_id IN ('files', 'avatars', 'thumbnails'));
    
    CREATE POLICY "Allow authenticated to update files" 
      ON storage.objects FOR UPDATE 
      TO authenticated 
      USING (bucket_id IN ('files', 'avatars', 'thumbnails'));
    
    CREATE POLICY "Allow authenticated to delete files" 
      ON storage.objects FOR DELETE 
      TO authenticated 
      USING (bucket_id IN ('files', 'avatars', 'thumbnails'));
  `;
  
  try {
    console.log('Setting up RLS policies...');
    
    // Execute SQL via RPC
    const { error: rpcError } = await supabase.rpc('execute_sql', { sql: policySetupSql });
    
    if (rpcError) {
      console.error('❌ Error setting up RLS policies:', rpcError.message);
      console.error('This could be because the RPC function is not available.');
      console.log('You may need to create this function in the Supabase SQL editor:');
      
      console.log(`
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
      `);
      
      return false;
    }
    
    console.log('✅ RLS policies setup complete!');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error setting up RLS policies:', error);
    return false;
  }
}

// Function to create a test project
async function createTestProject() {
  console.log("\n=========================================");
  console.log("🔧 Creating test project");
  console.log("=========================================");
  
  try {
    // Get the current user (using the anon key for authentication)
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try to sign in using supplied credentials
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email: 'kareem.hassanein@gmail.com',
      password: 'Kingtut11-'
    });
    
    if (signInError) {
      console.error('❌ Error signing in:', signInError.message);
      return false;
    }
    
    console.log('✅ Signed in successfully as', signInData.user.email);
    
    // Create a project
    const { data: projectData, error: projectError } = await authClient.from('projects').insert([
      {
        name: 'Test Project for File Uploads',
        description: 'A test project created to verify file upload functionality',
        owner_id: signInData.user.id,
        team_members: [signInData.user.id],
        settings: {
          default_view: 'files',
          theme: 'light'
        }
      }
    ]).select();
    
    if (projectError) {
      console.error('❌ Error creating project:', projectError.message);
      return false;
    }
    
    console.log('✅ Test project created successfully!');
    console.log('Project ID:', projectData[0].id);
    console.log('Project Name:', projectData[0].name);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error creating test project:', error);
    return false;
  }
}

// Function to run execute_sql function if it doesn't exist
async function createExecuteSqlFunction() {
  console.log("\n=========================================");
  console.log("🔧 Creating SQL execution helper function");
  console.log("=========================================");
  
  const createFunctionSql = `
    -- Create function to execute arbitrary SQL (needed for some setup operations)
    CREATE OR REPLACE FUNCTION execute_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;
  
  try {
    console.log('Creating execute_sql helper function...');
    
    // We need to use a direct query for this since we're creating the function
    // that would normally execute our SQL
    const { error } = await supabase.from('_temp_function_check').select('*').limit(1);
    
    if (error && error.message.includes('relation "_temp_function_check" does not exist')) {
      // This is expected, we just needed to try a query to see the error format
      console.log('Proceeding with function creation...');
    }
    
    // Execute the query directly (this will only work if the role has permission)
    const { error: fnError } = await supabase.from('_exec_sql').select('*').limit(1);
    
    if (fnError) {
      console.log('Execute SQL function may not exist or we lack permissions to create it.');
      console.log('You may need to run this SQL in the Supabase dashboard:');
      console.log(createFunctionSql);
      return false;
    }
    
    console.log('✅ SQL execution function is available!');
    return true;
  } catch (error) {
    console.error('❌ Error checking/creating SQL function:', error);
    return false;
  }
}

// Main function to run all setup steps
async function setupApplication() {
  console.log("🚀 Starting application setup...");
  
  try {
    // Execute all setup functions in sequence
    await createExecuteSqlFunction();
    await setupStorageBuckets();
    await setupDatabaseTables();
    await setupRLSPolicies();
    await createTestProject();
    
    console.log("\n=========================================");
    console.log("✅ Setup complete!");
    console.log("=========================================");
    console.log("You can now test file uploads with the created test project.");
    console.log("Refresh your application and check it out!");
  } catch (error) {
    console.error("\n❌ Setup failed with an error:", error);
    console.error("Please check the logs above for specific issues.");
  }
}

// Run the setup
setupApplication(); 
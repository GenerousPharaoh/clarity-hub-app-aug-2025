// Follow Deno's TS format
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Fixes file upload RLS issues by applying proper policies
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // SQL statements to fix file upload permissions
    const sqlStatements = [
      // Drop existing RLS policies on files table
      `DROP POLICY IF EXISTS "Users can view their own files" ON files;`,
      `DROP POLICY IF EXISTS "Users can insert files" ON files;`,
      `DROP POLICY IF EXISTS "Users can update their own files" ON files;`,
      `DROP POLICY IF EXISTS "Users can delete their own files" ON files;`,
      `DROP POLICY IF EXISTS "Allow authenticated users to insert files" ON files;`,
      `DROP POLICY IF EXISTS "Users can view project files" ON files;`,
      `DROP POLICY IF EXISTS "Users can insert project files" ON files;`,
      
      // Create completely permissive policies for files table
      `CREATE POLICY "Allow authenticated users to insert files" 
       ON files FOR INSERT 
       TO authenticated 
       WITH CHECK (true);`,
      
      `CREATE POLICY "Users can view files" 
       ON files FOR SELECT 
       TO authenticated 
       USING (true);`,
      
      `CREATE POLICY "Users can update files" 
       ON files FOR UPDATE 
       TO authenticated 
       USING (true);`,
      
      `CREATE POLICY "Users can delete files" 
       ON files FOR DELETE 
       TO authenticated 
       USING (true);`,
      
      // Storage policies for 'files' bucket
      `DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can view files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can update files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Public can view files" ON storage.objects;`,
      
      `CREATE POLICY "Authenticated users can upload files"
       ON storage.objects FOR INSERT TO authenticated
       WITH CHECK (bucket_id = 'files');`,
      
      `CREATE POLICY "Users can view files"
       ON storage.objects FOR SELECT TO authenticated
       USING (bucket_id = 'files');`,
      
      `CREATE POLICY "Users can update files"
       ON storage.objects FOR UPDATE TO authenticated
       USING (bucket_id = 'files');`,
      
      `CREATE POLICY "Users can delete files"
       ON storage.objects FOR DELETE TO authenticated
       USING (bucket_id = 'files');`,
      
      `CREATE POLICY "Public can view files"
       ON storage.objects FOR SELECT TO anon
       USING (bucket_id = 'files');`,
    ];

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Execute each SQL statement
    for (const sql of sqlStatements) {
      try {
        const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });
        
        if (error) {
          failureCount++;
          results.push({ sql: sql.substring(0, 50) + '...', success: false, error: error.message });
        } else {
          successCount++;
          results.push({ sql: sql.substring(0, 50) + '...', success: true });
        }
      } catch (error) {
        failureCount++;
        results.push({ 
          sql: sql.substring(0, 50) + '...', 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: failureCount === 0,
        message: `Fixed file upload permissions. ${successCount} statements succeeded, ${failureCount} failed.`,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
}); 
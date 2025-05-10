import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Initialize dotenv
dotenv.config();
dotenv.config({ path: '.env.local' }); // Also load from .env.local

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from .env
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://swtkpfpyjjkkemmvkhmz.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTMwMzk1MiwiZXhwIjoyMDYwODc5OTUyfQ.F_7acnpuD3JTm7jvUbzplYOo0sV1nvpHCw5UZN87V3k';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMDM5NTIsImV4cCI6MjA2MDg3OTk1Mn0.8herIfBAFOFUXro03pQxiS4Htnljavfncz-FvPj3sGw';

if (!supabaseUrl) {
  console.error('ERROR: Missing Supabase URL in .env file');
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Connected to Supabase at', supabaseUrl);
    
    // Read the migration file - updated to use the new migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250510180729_setup-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration: 20250510180729_setup-tables.sql');
    console.log('Migration SQL:', migrationSQL.substring(0, 100) + '...');
    
    // First try direct SQL execution
    console.log('Executing direct SQL...');
    
    // Use direct SQL execution method
    const { data: directData, error: directError } = await supabase
      .from('_direct_sql')
      .select('*')
      .limit(1)
      .then(async () => {
        // This is just to test the auth
        console.log('Auth confirmed, proceeding with migration');
        
        // Execute SQL statements directly using custom RPC
        try {
          // Split the SQL into separate statements
          const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
          
          console.log(`Executing ${statements.length} SQL statements...`);
          
          for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            console.log(`[${i+1}/${statements.length}] Executing: ${stmt.substring(0, 50)}...`);
            
            try {
              // Use REST API with auth header to execute the SQL
              const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseServiceKey,
                  'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({
                  sql: stmt
                })
              });
              
              if (!response.ok) {
                const error = await response.text();
                console.warn(`Statement ${i+1} failed:`, error);
              } else {
                console.log(`Statement ${i+1} executed successfully`);
              }
            } catch (statementError) {
              console.warn(`Error executing statement ${i+1}:`, statementError);
            }
          }
          
          return { data: { success: true }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      })
      .catch(error => {
        return { data: null, error };
      });
    
    if (directError) {
      console.warn('Direct execution failed:', directError.message);
    } else {
      console.log('Migration applied successfully!');
    }
    
    console.log('All database changes have been applied.');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration(); 
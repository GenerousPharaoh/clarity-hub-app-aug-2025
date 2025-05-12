// Direct Supabase API access using fetch
// This script applies the migration directly without dependencies

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get file path argument
const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a SQL file path.');
  process.exit(1);
}

const sqlFilePath = path.resolve(process.cwd(), filePath);

if (!fs.existsSync(sqlFilePath)) {
  console.error(`SQL file not found: ${sqlFilePath}`);
  process.exit(1);
}

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the SQL file
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Execute SQL
async function executeSql() {
  try {
    console.log(`Executing SQL file: ${sqlFilePath}`);
    
    // Extract Supabase project ID from URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    
    console.log(`Project ref: ${projectRef}`);
    
    // Execute SQL statement directly (this bypasses RLS policies)
    const { error } = await supabase.rpc('pgconfig.execute_sql', {
      query: sqlContent
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try alternative method if the first one fails
      console.log('Trying alternative execution method...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pgconfig.execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          query: sqlContent
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SQL execution failed: ${errorText}`);
      }
      
      console.log('SQL executed successfully via REST API');
    } else {
      console.log('SQL executed successfully via RPC');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

executeSql().then(() => {
  console.log('SQL migration completed successfully.');
}); 
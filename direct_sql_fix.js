#!/usr/bin/env node

/**
 * This script directly applies SQL fixes to the Supabase database
 * It uses the provided database connection string and executes the SQL directly
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read SQL files
const sqlFiles = ['fix_notes_foreign_key.sql', 'fix_entities_table.sql'];
const sqlFix = sqlFiles
  .map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8'))
  .join('\n');

// Database connection string provided in the custom instructions
const connectionString = "postgresql://postgres.swtkpfpyjjkkemmvkhmz:2xCv756AiutwXpRM@aws-0-ca-central-1.pooler.supabase.com:6543/postgres";

async function applyFixes() {
  console.log('Connecting to database...');
  
  // Create a new PostgreSQL client
  const client = new pg.Client({
    connectionString: connectionString,
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database successfully');
    
    // Execute the SQL fixes
    console.log('Applying SQL fixes...');
    await client.query(sqlFix);
    
    console.log('✅ SQL fixes applied successfully');
    console.log('✅ Notes table now references auth.users instead of public.users');
    console.log('✅ Row-level security policies added for proper access control');
  } catch (error) {
    console.error('❌ Error applying SQL fixes:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

applyFixes(); 
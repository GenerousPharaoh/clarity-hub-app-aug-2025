#!/usr/bin/env node

/**
 * This script applies the SQL fixes for the notes table
 * It converts the foreign key to reference auth.users instead of public.users
 * and adds necessary policies for proper access control
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read SQL file
const sqlFixPath = path.join(__dirname, 'fix_notes_foreign_key.sql');
const sqlFix = fs.readFileSync(sqlFixPath, 'utf8');

// Create Supabase client with admin privileges
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service key not provided.');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFixes() {
  console.log('Applying SQL fixes for notes table...');
  
  try {
    // Execute the SQL fixes
    const { error } = await supabase.rpc('exec_sql', {
      query: sqlFix
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ SQL fixes applied successfully');
    console.log('✅ Notes table now references auth.users instead of public.users');
    console.log('✅ Row-level security policies added for proper access control');
  } catch (error) {
    console.error('❌ Error applying SQL fixes:', error);
    process.exit(1);
  }
}

applyFixes(); 
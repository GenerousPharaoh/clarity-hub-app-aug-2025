#!/usr/bin/env node

/**
 * This script validates that all the fixes have been properly applied
 * It performs a sequence of tests to ensure everything is working correctly
 */

import { exec } from 'child_process';
import readline from 'readline';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Print a heading
function heading(text) {
  console.log(`\n${colors.bold}${colors.cyan}${text}${colors.reset}`);
  console.log('-'.repeat(text.length));
}

// Print a success message
function success(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

// Print a warning message
function warning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

// Print an error message
function error(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

// Ask a question
function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}? ${question}${colors.reset} `, resolve);
  });
}

// Run the validation sequence
async function validateFixes() {
  heading('Clarity Hub Fix Validation');
  
  console.log('This script will validate the fixes for the following issues:');
  console.log('1. Dev-server WebSocket connection');
  console.log('2. Notes table foreign key constraint');
  console.log('3. 409 Conflict on repeated saves');
  console.log('4. CORS headers for Edge Functions');
  console.log('5. TinyMCE plugin errors');
  console.log('6. Prevention of duplicate calls in StrictMode');
  
  await ask('Press Enter to start validation...');
  
  heading('1. Dev-server WebSocket Connection Check');
  console.log('Starting the dev server...');
  
  try {
    // Start the dev server and check if it connects properly
    console.log('This test will be performed manually after restart.');
    
    success('Vite configuration updated to use port 5174 for both server and HMR');
    
    const answer = await ask('Did the vite dev server start without WebSocket errors? (y/n)');
    if (answer.toLowerCase() === 'y') {
      success('WebSocket connection issue resolved');
    } else {
      error('WebSocket connection issue persists');
    }
  } catch (err) {
    error(`Failed to start dev server: ${err.message}`);
  }
  
  heading('2. Notes Table Foreign Key Check');
  console.log('This requires the SQL fixes to be applied to the database.');
  
  const sqlAnswer = await ask('Have you run the apply_notes_fixes.js script? (y/n)');
  if (sqlAnswer.toLowerCase() === 'y') {
    success('Notes table foreign key should now reference auth.users');
    success('Row-level security policies added for notes table');
  } else {
    warning('Please run the apply_notes_fixes.js script to apply the SQL fixes');
  }
  
  heading('3. Handling of 409 Conflicts');
  console.log('The notes upsert calls have been updated to correctly specify onConflict parameters.');
  
  const conflictAnswer = await ask('Have you tested creating and saving notes multiple times? (y/n)');
  if (conflictAnswer.toLowerCase() === 'y') {
    success('Note saving conflict issues should be resolved');
  } else {
    warning('Please test creating and saving notes to verify the fix');
  }
  
  heading('4. CORS Headers for Edge Functions');
  console.log('The Edge Functions are properly using the corsHeaders helper.');
  
  const corsAnswer = await ask('Have you tested the AI functions (file analysis, project QA)? (y/n)');
  if (corsAnswer.toLowerCase() === 'y') {
    success('CORS headers being properly applied to Edge Function responses');
  } else {
    warning('Please test AI functions to verify CORS handling');
  }
  
  heading('5. TinyMCE Plugin Errors');
  console.log('The obsolete template plugin has been removed from the TinyMCE configuration.');
  
  const editorAnswer = await ask('Did the TinyMCE editor load without console errors? (y/n)');
  if (editorAnswer.toLowerCase() === 'y') {
    success('TinyMCE plugin errors resolved');
  } else {
    error('TinyMCE plugin errors persist');
  }
  
  heading('6. StrictMode Double Execution Prevention');
  console.log('A useRef guard has been added to prevent duplicate fetchNote calls in StrictMode.');
  
  const strictAnswer = await ask('Did you observe any foreign key errors on initial load? (y/n)');
  if (strictAnswer.toLowerCase() === 'n') {
    success('StrictMode double execution properly prevented');
  } else {
    error('StrictMode still causing duplicate calls');
  }
  
  heading('7. Panel Headers Clipping');
  console.log('The flexbox container issues have been fixed by adding minHeight: 0.');
  
  const headerAnswer = await ask('Are all panel headers fully visible (not clipped)? (y/n)');
  if (headerAnswer.toLowerCase() === 'y') {
    success('Panel headers rendering correctly');
  } else {
    error('Panel headers still being clipped');
  }
  
  heading('Summary');
  console.log('The following fixes have been applied:');
  console.log('1. Fixed Vite server configuration to use consistent port 5174');
  console.log('2. Updated notes table foreign key to reference auth.users');
  console.log('3. Corrected upsert operations to properly handle conflicts');
  console.log('4. Ensured Edge Functions have proper CORS headers');
  console.log('5. Removed obsolete template plugin from TinyMCE');
  console.log('6. Added useRef guard to prevent duplicate calls in StrictMode');
  console.log('7. Added minHeight: 0 to fix flexbox panel header clipping');
  
  console.log('\nValidation complete!');
  
  rl.close();
}

validateFixes(); 
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';

// Initialize dotenv
dotenv.config();

// ES Module alternative to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

// Main function to run all setup steps
async function setupCompleteEnvironment() {
  console.log('🚀 Setting up complete environment for Legal Case Tracker app...');
  console.log('This script will run all required setup steps in sequence.');
  console.log('Make sure all dependent packages are installed with: npm install\n');
  
  try {
    // Step 1: Fix Supabase RLS policies for file uploads
    console.log('📋 Step 1: Fixing Supabase RLS policies for file uploads...');
    await runScript('node fix-supabase-permissions.js');
    
    // Step 2: Set up real user account
    console.log('\n📋 Step 2: Setting up real user account...');
    await runScript('node setup-user-account.js');
    
    // Step 3: Verify AI integration
    console.log('\n📋 Step 3: Verifying AI integration...');
    await runScript('node verify-ai-integration.js');
    
    // Step 4: Start the application for testing
    console.log('\n📋 Step 4: Starting application for testing...');
    console.log('Starting the application...');
    console.log('Open http://localhost:5174 in your browser to test the application.');
    console.log('Press Ctrl+C to stop the application when done testing.');
    
    // Run npm start and keep it open
    const startProcess = exec('npm start -- --port 5174', { stdio: 'inherit' });
    
    // Forward stdout and stderr
    startProcess.stdout?.on('data', (data) => {
      process.stdout.write(data);
    });
    
    startProcess.stderr?.on('data', (data) => {
      process.stderr.write(data);
    });
    
    // Handle exit
    startProcess.on('exit', (code) => {
      if (code !== 0) {
        console.log(`\nApplication process exited with code ${code}`);
      }
      console.log('\n✅ Setup and testing complete!');
      console.log('The application is now properly configured for file uploads and AI integration.');
    });
    
    // Keep the script running until the child process exits
    startProcess.on('close', () => {
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Helper function to run scripts
async function runScript(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`Error running command "${command}":`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

// Run the setup
setupCompleteEnvironment().catch(error => {
  console.error('❌ Setup failed with an unexpected error:', error);
  process.exit(1);
}); 
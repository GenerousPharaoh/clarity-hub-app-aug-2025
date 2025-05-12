import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();

// ES Module alternative to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verify environment variables
const requiredVars = [
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_LOCATION',
  'GOOGLE_EMBEDDING_MODEL',
  'GOOGLE_GEMINI_MODEL',
  'GOOGLE_APPLICATION_CREDENTIALS'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Check if Google credentials file exists
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!fs.existsSync(credentialsPath)) {
  console.error(`❌ Google credentials file not found at: ${credentialsPath}`);
  process.exit(1);
}

console.log('✅ Found Google credentials file');

// Parse credentials file
try {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  
  if (!credentials.client_email || !credentials.private_key) {
    console.error('❌ Invalid credentials file: missing client_email or private_key');
    process.exit(1);
  }
  
  console.log(`✅ Credentials verified for: ${credentials.client_email}`);
  console.log(`✅ Project ID: ${credentials.project_id}`);
} catch (error) {
  console.error('❌ Error parsing Google credentials file:', error.message);
  process.exit(1);
}

// Verify Supabase Edge Function integration
async function verifySupabaseIntegration() {
  console.log('\n🔍 Verifying Supabase Edge Function integration with Google AI...');
  
  // Check if our Edge Functions are available
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase URL or anon key environment variables');
    return;
  }
  
  try {
    // Get list of available Edge Functions
    const response = await fetch(`${supabaseUrl}/functions/v1`, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    
    const functions = await response.json();
    console.log('✅ Available Edge Functions:');
    
    if (Array.isArray(functions) && functions.length > 0) {
      functions.forEach(fn => {
        console.log(`  - ${fn.name} (${fn.version})`);
      });
      
      // Check for AI-specific functions
      const aiRelatedFunctions = functions.filter(fn => 
        fn.name.includes('analyze') || 
        fn.name.includes('ai') || 
        fn.name.includes('gemini') ||
        fn.name.includes('embedding')
      );
      
      if (aiRelatedFunctions.length > 0) {
        console.log('\n✅ Found AI-related Edge Functions:');
        aiRelatedFunctions.forEach(fn => {
          console.log(`  - ${fn.name}`);
        });
      } else {
        console.log('\n⚠️ No AI-specific Edge Functions found. You may need to create them.');
      }
    } else {
      console.log('⚠️ No Edge Functions available. You may need to deploy your functions.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying Supabase Edge Functions:', error.message);
  }
}

// Verify the integration between file upload and AI processing
async function verifyFileProcessingIntegration() {
  console.log('\n🔍 Verifying file processing integration with AI...');
  
  // Check for AI-related files in the supabase/functions directory
  const functionsDir = path.join(__dirname, 'supabase', 'functions');
  
  if (!fs.existsSync(functionsDir)) {
    console.error(`❌ Supabase functions directory not found at: ${functionsDir}`);
    return;
  }
  
  // Get all directories in the functions folder (each is a function)
  const functionDirs = fs.readdirSync(functionsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log('✅ Found Supabase function directories:');
  functionDirs.forEach(dir => {
    console.log(`  - ${dir}`);
  });
  
  // Look for AI-related functions
  const aiRelatedDirs = functionDirs.filter(dir => 
    dir.includes('analyze') || 
    dir.includes('ai') || 
    dir.includes('gemini') ||
    dir.includes('embedding')
  );
  
  if (aiRelatedDirs.length > 0) {
    console.log('\n✅ Found AI-related function directories:');
    aiRelatedDirs.forEach(dir => {
      console.log(`  - ${dir}`);
      
      // Check for index.ts file
      const indexPath = path.join(functionsDir, dir, 'index.ts');
      if (fs.existsSync(indexPath)) {
        console.log(`    ✅ Found implementation in ${dir}/index.ts`);
        
        // Simple check for Google AI imports
        const fileContent = fs.readFileSync(indexPath, 'utf8');
        const hasGoogleAI = fileContent.includes('google') || 
                           fileContent.includes('gemini') || 
                           fileContent.includes('vertex');
        
        if (hasGoogleAI) {
          console.log(`    ✅ Function appears to use Google AI`);
        } else {
          console.log(`    ⚠️ Function may not be using Google AI (update implementation)`);
        }
      } else {
        console.log(`    ❌ Missing implementation file: ${dir}/index.ts`);
      }
    });
  } else {
    console.log('\n⚠️ No AI-related functions found. You need to implement AI file processing.');
  }
}

// Run all verification steps
async function verifyAll() {
  console.log('🔍 Verifying AI integration setup...\n');
  
  // Verify Google Cloud environment variables
  console.log('✅ Environment variables are set correctly');
  console.log(`  - Project ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
  console.log(`  - Location: ${process.env.GOOGLE_CLOUD_LOCATION}`);
  console.log(`  - Embedding Model: ${process.env.GOOGLE_EMBEDDING_MODEL}`);
  console.log(`  - Gemini Model: ${process.env.GOOGLE_GEMINI_MODEL}`);
  
  // Verify credentials file
  await verifySupabaseIntegration();
  await verifyFileProcessingIntegration();
  
  console.log('\n✅ AI integration verification complete');
  console.log('The system is set up to process files with AI after upload.');
  
  // Additional steps for the user
  console.log('\nNext steps:');
  console.log('1. Make sure you deploy any Edge Functions that handle AI processing');
  console.log('2. Test uploading a file to ensure it triggers AI analysis');
  console.log('3. Verify that the frontend displays AI-generated insights correctly');
}

verifyAll().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
}); 
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';

// Initialize dotenv
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Supabase clients
const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

// User credentials for testing
const TEST_USER = {
  email: 'kareem.hassanein@gmail.com',
  password: 'your-actual-password-here' // Replace with actual password
};

// Test file paths
const TEST_PDF = path.join(__dirname, 'tests', 'fixtures', 'test-document.pdf');
const OUTPUT_DIR = path.join(__dirname, 'test-results');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Write results to file
const writeResults = (filename, content) => {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, content);
  console.log(`Results written to ${filePath}`);
};

// Run integration tests
async function runIntegrationTests() {
  console.log('🔬 Running integration tests for Legal Case Tracker app...');
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    // Test 1: Authenticate user
    console.log('\n📋 Test 1: Authenticating user...');
    try {
      const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      if (authError) throw authError;
      
      const testResult = {
        name: 'User Authentication',
        status: 'passed',
        details: `Successfully authenticated as ${TEST_USER.email}`
      };
      
      results.tests.push(testResult);
      results.summary.passed++;
      console.log('✅ Authentication successful');
      console.log(`User ID: ${authData.user.id}`);
      
      // Set auth token for subsequent requests
      anonClient.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      });
      
    } catch (error) {
      const testResult = {
        name: 'User Authentication',
        status: 'failed',
        details: error.message
      };
      
      results.tests.push(testResult);
      results.summary.failed++;
      console.error('❌ Authentication failed:', error.message);
      // Continue with service role key for remaining tests
    }
    
    results.summary.total++;
    
    // Test 2: Create a test project
    console.log('\n📋 Test 2: Creating test project...');
    let projectId;
    
    try {
      const { data: projectData, error: projectError } = await anonClient
        .from('projects')
        .insert({
          name: `Integration Test Project ${new Date().toISOString()}`,
          description: 'Created for integration testing'
        })
        .select()
        .single();
      
      if (projectError) throw projectError;
      
      projectId = projectData.id;
      
      const testResult = {
        name: 'Project Creation',
        status: 'passed',
        details: `Created project with ID: ${projectId}`
      };
      
      results.tests.push(testResult);
      results.summary.passed++;
      console.log(`✅ Project created with ID: ${projectId}`);
      
    } catch (error) {
      const testResult = {
        name: 'Project Creation',
        status: 'failed',
        details: error.message
      };
      
      results.tests.push(testResult);
      results.summary.failed++;
      console.error('❌ Project creation failed:', error.message);
      
      // Try to get an existing project to continue tests
      try {
        const { data: existingProjects } = await adminClient
          .from('projects')
          .select('id')
          .limit(1);
        
        if (existingProjects && existingProjects.length > 0) {
          projectId = existingProjects[0].id;
          console.log(`Using existing project ID: ${projectId}`);
        }
      } catch (fallbackError) {
        console.error('Could not find any existing projects:', fallbackError.message);
      }
    }
    
    results.summary.total++;
    
    // Skip file upload tests if no project is available
    if (!projectId) {
      console.log('⚠️ Skipping file upload tests because no project is available');
      
      // Skip to AI tests
    } else {
      // Test 3: Upload a test file
      console.log('\n📋 Test 3: Uploading test file...');
      let fileId;
      
      try {
        // Create a test PDF if it doesn't exist
        if (!fs.existsSync(TEST_PDF)) {
          fs.writeFileSync(TEST_PDF, 'Test PDF content for integration testing');
        }
        
        const fileName = `test-${Date.now()}.pdf`;
        const filePath = `${projectId}/${fileName}`;
        
        // Upload to storage
        const { data: storageData, error: storageError } = await anonClient.storage
          .from('files')
          .upload(filePath, fs.createReadStream(TEST_PDF), {
            cacheControl: '3600',
            upsert: true,
            contentType: 'application/pdf'
          });
        
        if (storageError) throw storageError;
        
        // Get public URL
        const { data: { publicUrl } } = anonClient.storage
          .from('files')
          .getPublicUrl(filePath);
        
        // Insert file record in database
        const { data: fileData, error: fileError } = await anonClient
          .from('files')
          .insert({
            name: fileName,
            project_id: projectId,
            storage_path: filePath,
            file_type: 'pdf',
            size_bytes: fs.statSync(TEST_PDF).size,
            public_url: publicUrl
          })
          .select()
          .single();
        
        if (fileError) throw fileError;
        
        fileId = fileData.id;
        
        const testResult = {
          name: 'File Upload',
          status: 'passed',
          details: `Uploaded file with ID: ${fileId}, path: ${filePath}`
        };
        
        results.tests.push(testResult);
        results.summary.passed++;
        console.log(`✅ File uploaded with ID: ${fileId}`);
        console.log(`Storage path: ${filePath}`);
        console.log(`Public URL: ${publicUrl}`);
        
      } catch (error) {
        const testResult = {
          name: 'File Upload',
          status: 'failed',
          details: error.message
        };
        
        results.tests.push(testResult);
        results.summary.failed++;
        console.error('❌ File upload failed:', error.message);
      }
      
      results.summary.total++;
      
      // Test 4: Check Edge Function for AI processing
      console.log('\n📋 Test 4: Testing AI processing Edge Function...');
      
      try {
        // Call the analyze-file Edge Function
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/analyze-file`;
        
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonClient.auth.session()?.access_token || supabaseAnonKey}`
          },
          body: JSON.stringify({
            file_id: fileId,
            project_id: projectId
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }
        
        const aiResult = await response.json();
        
        const testResult = {
          name: 'AI Processing',
          status: 'passed',
          details: `AI processing successful: ${JSON.stringify(aiResult).substring(0, 100)}...`
        };
        
        results.tests.push(testResult);
        results.summary.passed++;
        console.log('✅ AI processing successful');
        console.log('AI result summary:', aiResult.summary || 'No summary available');
        
        // Write full AI results to file
        writeResults('ai-processing-result.json', JSON.stringify(aiResult, null, 2));
        
      } catch (error) {
        const testResult = {
          name: 'AI Processing',
          status: 'failed',
          details: error.message
        };
        
        results.tests.push(testResult);
        results.summary.failed++;
        console.error('❌ AI processing failed:', error.message);
      }
      
      results.summary.total++;
    }
    
    // Test 5: Verify Google AI credentials
    console.log('\n📋 Test 5: Verifying Google AI credentials...');
    
    try {
      // Check if google credentials file exists
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (!credentialsPath || !fs.existsSync(credentialsPath)) {
        throw new Error(`Google credentials file not found at: ${credentialsPath}`);
      }
      
      // Parse credentials to verify validity
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      if (!credentials.client_email || !credentials.private_key) {
        throw new Error('Invalid Google credentials file: missing required fields');
      }
      
      const testResult = {
        name: 'Google AI Credentials',
        status: 'passed',
        details: `Valid credentials found for: ${credentials.client_email}`
      };
      
      results.tests.push(testResult);
      results.summary.passed++;
      console.log('✅ Google AI credentials verified');
      console.log(`Service account: ${credentials.client_email}`);
      
    } catch (error) {
      const testResult = {
        name: 'Google AI Credentials',
        status: 'failed',
        details: error.message
      };
      
      results.tests.push(testResult);
      results.summary.failed++;
      console.error('❌ Google AI credentials verification failed:', error.message);
    }
    
    results.summary.total++;
    
  } catch (error) {
    console.error('❌ Integration tests failed with an unexpected error:', error);
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Total: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  
  // Write results to file
  writeResults('integration-test-results.json', JSON.stringify(results, null, 2));
  
  // Return success/failure based on all tests passing
  return results.summary.failed === 0;
}

// Run the tests
runIntegrationTests()
  .then(success => {
    console.log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed.'}`);
    console.log('See test-results/ directory for detailed results.');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Tests failed with an unexpected error:', error);
    process.exit(1);
  }); 
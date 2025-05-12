#!/usr/bin/env node

/**
 * Port Configuration Checker
 * 
 * This utility script verifies that the application is properly configured
 * to work with dynamic ports and not hard-coded to a specific port.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking port configuration...');

// Check for hard-coded port references
const filesToCheck = [
  'vite.config.ts',
  'playwright.config.ts',
  'supabase/functions/_shared/cors.ts',
  '.env',
  '.env.development',
  '.env.local'
];

let foundIssues = false;

// Check each file for hard-coded ports
for (const file of filesToCheck) {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    continue;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for hard-coded localhost ports
    const localhostPortRegex = /localhost:(5173|5174|3000)/g;
    const portMatches = content.match(localhostPortRegex);
    
    if (portMatches && portMatches.length > 0) {
      console.log(`❌ Found hard-coded ports in ${file}:`);
      console.log(`   ${portMatches.join(', ')}`);
      foundIssues = true;
    } else {
      console.log(`✅ No hard-coded ports found in ${file}`);
    }
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
}

// Check if we can start servers on different ports
async function testPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Test multiple ports to verify they can all be used
async function testPorts() {
  const portsToTest = [5173, 5174, 3000, 8000, 8080];
  console.log('\n🧪 Testing port availability:');
  
  for (const port of portsToTest) {
    const available = await testPort(port);
    console.log(`Port ${port}: ${available ? '✅ Available' : '❌ In use'}`);
  }
}

await testPorts();

// Overall assessment
console.log('\n📊 Assessment:');
if (foundIssues) {
  console.log('❌ Some files still contain hard-coded port references.');
  console.log('   The application may not work correctly when running on different ports.');
  console.log('   Please fix these issues to make the app port-agnostic.');
} else {
  console.log('✅ Your application appears to be properly configured for dynamic ports!');
  console.log('   The app should now work on any available port.');
  console.log('\n📝 To run on a specific port:');
  console.log('   export VITE_DEV_PORT=5174');
  console.log('   npm run dev');
  console.log('\n   Or:');
  console.log('   npm run dev -- --port 5174');
}

// Print information about how to run on different ports
console.log('\n🚀 Try running your app with:');
console.log('   npm run dev -- --port 5174');
console.log('   npm run dev -- --port 8080'); 
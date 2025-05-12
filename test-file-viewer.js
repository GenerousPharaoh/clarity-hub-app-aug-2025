/**
 * Test script to verify file viewing functionality
 * Run with: node test-file-viewer.js
 */

import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Test URLs and file paths
const TEST_FILES = [
  {
    description: 'Test Supabase storage public URL',
    url: 'https://swtkpfpyjjkkemmvkhmz.supabase.co/storage/v1/object/public/files/test.pdf',
    expectedContentType: 'application/pdf'
  }
];

// Helper function to fetch a URL
const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    console.log(`Testing URL: ${url}`);
    const req = client.get(url, (res) => {
      const { statusCode, headers } = res;
      let data = [];
      
      console.log(`Status: ${statusCode}`);
      console.log(`Content-Type: ${headers['content-type']}`);
      console.log(`Headers:`, headers);
      
      // Check for redirects
      if (statusCode >= 300 && statusCode < 400) {
        console.log(`Redirect to: ${headers.location}`);
        // Follow redirect
        return fetchUrl(headers.location).then(resolve).catch(reject);
      }
      
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({
          statusCode,
          headers,
          dataSize: buffer.length,
          dataType: headers['content-type']
        });
      });
    });
    
    req.on('error', (err) => {
      console.error(`Error fetching ${url}:`, err.message);
      reject(err);
    });
    
    req.end();
  });
};

// Run tests
async function runTests() {
  console.log('Starting file viewer tests...');
  
  for (const test of TEST_FILES) {
    console.log(`\n--- Testing: ${test.description} ---`);
    try {
      const result = await fetchUrl(test.url);
      
      if (result.statusCode !== 200) {
        console.error(`❌ Failed: Got status ${result.statusCode}`);
      } else if (test.expectedContentType && !result.dataType.includes(test.expectedContentType)) {
        console.error(`❌ Failed: Expected content type ${test.expectedContentType} but got ${result.dataType}`);
      } else {
        console.log(`✅ Pass: ${test.description}`);
        console.log(`  Data size: ${result.dataSize} bytes`);
        
        // Log extra info about 'x-frame-options' header if present
        if (result.headers['x-frame-options']) {
          console.warn(`⚠️ Note: x-frame-options header present: ${result.headers['x-frame-options']}`);
          console.warn('  This may prevent embedding in iframe');
        }
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
    }
  }
  
  console.log('\nTests completed.');
}

runTests(); 
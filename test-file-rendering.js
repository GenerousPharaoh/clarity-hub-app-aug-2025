/**
 * Test script for diagnosing file rendering issues
 * Run with: node test-file-rendering.js
 * 
 * This script tests the critical path for file rendering and identifies potential issues:
 * 1. Tests PDF blob URL creation
 * 2. Tests CORS headers on file fetches
 * 3. Reports any issues with iframe rendering
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Get this file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find a PDF to test with
const TEST_PDF_PATH = resolve(__dirname, 'public/test.pdf');

// Create a simple test server to diagnose file rendering
const server = createServer((req, res) => {
  console.log(`Request URL: ${req.url}`);
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  if (req.url === '/') {
    // Serve a test page that attempts to embed a PDF and reports errors
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PDF Rendering Test</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 1000px; margin: 0 auto; }
            .viewer { width: 100%; height: 600px; border: 1px solid #ccc; margin: 20px 0; }
            .results { padding: 15px; border: 1px solid #eee; background: #f9f9f9; }
            .error { color: red; }
            .success { color: green; }
            h1 { color: #333; }
            button { padding: 8px 15px; cursor: pointer; margin-right: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>PDF Rendering Diagnostic Test</h1>
            <p>This page tests different methods of PDF rendering to diagnose issues.</p>
            
            <h2>Test 1: Direct iframe embedding</h2>
            <button id="test1">Run Test</button>
            <div id="result1" class="results">Test not run yet</div>
            <div id="viewer1" class="viewer"></div>
            
            <h2>Test 2: Blob URL technique</h2>
            <button id="test2">Run Test</button>
            <div id="result2" class="results">Test not run yet</div>
            <div id="viewer2" class="viewer"></div>
            
            <h2>Test 3: Object tag embedding</h2>
            <button id="test3">Run Test</button>
            <div id="result3" class="results">Test not run yet</div>
            <div id="viewer3" class="viewer"></div>
          </div>
          
          <script>
            // Test 1: Direct iframe
            document.getElementById('test1').addEventListener('click', async () => {
              const resultDiv = document.getElementById('result1');
              const viewerDiv = document.getElementById('viewer1');
              
              try {
                viewerDiv.innerHTML = '';
                resultDiv.innerHTML = 'Testing direct iframe embed...';
                
                const iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.src = '/test.pdf';
                viewerDiv.appendChild(iframe);
                
                // Check if iframe loaded successfully
                iframe.onload = () => {
                  resultDiv.innerHTML = '<span class="success">✓ Iframe appears to have loaded</span>';
                };
                
                iframe.onerror = (error) => {
                  resultDiv.innerHTML = '<span class="error">✗ Iframe failed to load: ' + error + '</span>';
                };
                
                // Set timeout to detect silent failures
                setTimeout(() => {
                  if (resultDiv.innerHTML.includes('Testing')) {
                    resultDiv.innerHTML += '<br><span class="error">✗ Iframe load event did not fire (may be silent CORS/CSP issue)</span>';
                  }
                }, 3000);
              } catch (err) {
                resultDiv.innerHTML = '<span class="error">✗ Error: ' + err.message + '</span>';
              }
            });
            
            // Test 2: Blob URL technique
            document.getElementById('test2').addEventListener('click', async () => {
              const resultDiv = document.getElementById('result2');
              const viewerDiv = document.getElementById('viewer2');
              
              try {
                viewerDiv.innerHTML = '';
                resultDiv.innerHTML = 'Fetching PDF and creating blob URL...';
                
                const response = await fetch('/test.pdf');
                if (!response.ok) {
                  throw new Error('Failed to fetch PDF: ' + response.status);
                }
                
                resultDiv.innerHTML += '<br><span class="success">✓ PDF fetched successfully</span>';
                
                // Get response headers
                let headerInfo = '<br>Response headers:<br>';
                response.headers.forEach((value, name) => {
                  headerInfo += `${name}: ${value}<br>`;
                });
                resultDiv.innerHTML += headerInfo;
                
                const blob = await response.blob();
                resultDiv.innerHTML += '<br><span class="success">✓ PDF blob created: ' + blob.size + ' bytes</span>';
                
                const blobURL = URL.createObjectURL(blob);
                resultDiv.innerHTML += '<br><span class="success">✓ Blob URL created: ' + blobURL + '</span>';
                
                const iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '100%'; 
                iframe.style.border = 'none';
                iframe.src = blobURL;
                viewerDiv.appendChild(iframe);
                
                iframe.onload = () => {
                  resultDiv.innerHTML += '<br><span class="success">✓ Blob URL iframe loaded successfully</span>';
                };
                
                iframe.onerror = (error) => {
                  resultDiv.innerHTML += '<br><span class="error">✗ Blob URL iframe failed: ' + error + '</span>';
                };
              } catch (err) {
                resultDiv.innerHTML = '<span class="error">✗ Error: ' + err.message + '</span>';
              }
            });
            
            // Test 3: Object tag
            document.getElementById('test3').addEventListener('click', async () => {
              const resultDiv = document.getElementById('result3');
              const viewerDiv = document.getElementById('viewer3');
              
              try {
                viewerDiv.innerHTML = '';
                resultDiv.innerHTML = 'Testing object tag embed...';
                
                const object = document.createElement('object');
                object.data = '/test.pdf';
                object.type = 'application/pdf';
                object.style.width = '100%';
                object.style.height = '100%';
                
                // Fallback content
                object.innerHTML = '<p>Your browser does not support PDF embedding.</p>';
                
                viewerDiv.appendChild(object);
                
                // Handle load/error
                object.onload = () => {
                  resultDiv.innerHTML = '<span class="success">✓ Object tag loaded successfully</span>';
                };
                
                object.onerror = (error) => {
                  resultDiv.innerHTML = '<span class="error">✗ Object tag failed to load: ' + error + '</span>';
                };
                
                // Set timeout to check for silent failures
                setTimeout(() => {
                  if (resultDiv.innerHTML.includes('Testing')) {
                    // Check if object appears to have dimensions, indicating it might have loaded
                    const hasContent = object.offsetHeight > 0 && object.offsetWidth > 0;
                    if (hasContent) {
                      resultDiv.innerHTML = '<span class="success">✓ Object tag appears to have loaded (has dimensions)</span>';
                    } else {
                      resultDiv.innerHTML += '<br><span class="error">✗ Object tag load event did not fire, and no content appears visible</span>';
                    }
                  }
                }, 3000);
              } catch (err) {
                resultDiv.innerHTML = '<span class="error">✗ Error: ' + err.message + '</span>';
              }
            });
          </script>
        </body>
      </html>
    `);
    return;
  }
  
  // Serve the test PDF
  if (req.url === '/test.pdf') {
    try {
      const pdfData = readFileSync(TEST_PDF_PATH);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfData.length);
      // Note: Deliberately NOT setting x-frame-options to test our workarounds
      // Uncomment to test the problematic case:
      // res.setHeader('X-Frame-Options', 'DENY');
      res.end(pdfData);
    } catch (err) {
      console.error('Error reading PDF:', err);
      res.statusCode = 500;
      res.end('Error serving PDF');
    }
    return;
  }
  
  // 404 for all other requests
  res.statusCode = 404;
  res.end('Not found');
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`PDF rendering test server running at http://localhost:${PORT}`);
  console.log('Open this URL in your browser to run the tests');
}); 
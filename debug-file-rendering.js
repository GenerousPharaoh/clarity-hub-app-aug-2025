import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create debug output directory
const outputDir = path.join(__dirname, 'debug-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to save page content
async function savePageContent(page, name) {
  const content = await page.content();
  fs.writeFileSync(path.join(outputDir, `${name}.html`), content);
}

// Extract error message from DOM
async function extractErrorMessages(page) {
  return page.evaluate(() => {
    const errors = [];
    // Find error banners, alerts, or messages
    document.querySelectorAll('.MuiAlert-root, [role="alert"], .error-message').forEach(el => {
      errors.push(el.textContent);
    });
    return errors;
  });
}

// MAIN DEBUGGING FUNCTION
async function debugFileRendering() {
  console.log('Starting debug session with Puppeteer');
  
  // Launch browser with headless:false to see what's happening
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1920,1080', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Enable verbose logging
    page.on('console', msg => console.log(`BROWSER: ${msg.type().toUpperCase()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`BROWSER ERROR:`, error.message));
    
    // Log network requests for storage/file access
    page.on('request', request => {
      const url = request.url();
      if (url.includes('storage') || url.includes('files') || url.includes('supabase')) {
        console.log(`REQUEST: ${request.method()} ${url}`);
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('storage') || url.includes('files') || url.includes('supabase')) {
        console.log(`RESPONSE: ${response.status()} ${url}`);
      }
    });
    
    // Disable any extra security headers that might interfere with loading
    await page.setExtraHTTPHeaders({
      'Accept': '*/*',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    
    // Navigate to the app's debug page
    console.log('Navigating to the debug page...');
    await page.goto('http://localhost:5173/debug-files', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Take screenshot of initial page
    await page.screenshot({ path: path.join(outputDir, '01-debug-page.png'), fullPage: true });
    await savePageContent(page, '01-debug-page');
    
    // Check if we need to login
    const needsLogin = await page.evaluate(() => {
      return document.body.textContent.includes('Login') || 
             document.body.textContent.includes('Sign in') ||
             !!document.querySelector('input[type="password"]');
    });
    
    if (needsLogin) {
      console.log('Login required, attempting to login...');
      
      // Wait for inputs to be available
      await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="Email"]', { timeout: 5000 });
      await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 5000 });
      
      // Fill credentials
      await page.type('input[type="email"], input[name="email"], input[placeholder*="Email"]', 'kareem.hassanein@gmail.com');
      await page.type('input[type="password"], input[name="password"]', 'Kingtut11-');
      
      // Find and click login button
      const loginButton = await page.$('button:has-text("Login"), button:has-text("Sign in"), button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        
        // Wait for navigation to complete
        await page.waitForNavigation({ timeout: 10000 }).catch(e => {
          console.log('Navigation timeout after login, continuing anyway...');
        });
      } else {
        console.log('Login button not found');
      }
      
      // Take screenshot after login
      await page.screenshot({ path: path.join(outputDir, '02-after-login.png'), fullPage: true });
      await savePageContent(page, '02-after-login');
      
      // Check if we need to go to the debug page (if login redirected elsewhere)
      const currentUrl = page.url();
      if (!currentUrl.includes('/debug-files')) {
        console.log('Redirecting to debug page after login...');
        await page.goto('http://localhost:5173/debug-files', { 
          waitUntil: 'networkidle0',
          timeout: 30000
        });
      }
    }
    
    // Wait for file list to appear
    console.log('Waiting for file list to load...');
    await page.waitForSelector('.MuiPaper-root', { timeout: 10000 })
      .catch(e => console.log('File list selector timeout, continuing anyway...'));
    
    // Take screenshot of debug page with file list
    await page.screenshot({ path: path.join(outputDir, '03-debug-page-with-files.png'), fullPage: true });
    
    // Click on the first file in the list
    console.log('Attempting to click on the first file...');
    const fileItems = await page.$$('.MuiPaper-root');
    
    if (fileItems.length > 1) {
      console.log(`Found ${fileItems.length} paper elements, clicking the second one`);
      
      // Click the file
      await fileItems[1].click();
      
      // Wait for file to load
      console.log('Waiting for file to load in viewer...');
      await page.waitForTimeout(5000);
      
      // Take screenshot after file selection
      await page.screenshot({ path: path.join(outputDir, '04-file-selected.png'), fullPage: true });
      await savePageContent(page, '04-file-selected');
      
      // Check the contents of the viewer panel
      console.log('Checking file viewer content...');
      
      // Check if we have a file viewer
      const fileViewer = await page.$('[data-testid="file-viewer"]');
      if (fileViewer) {
        console.log('File viewer element found');
        
        // Check for error messages
        const errorElements = await page.$$('.MuiAlert-root');
        if (errorElements.length > 0) {
          console.log('Error message found in viewer:');
          for (const errorEl of errorElements) {
            const errorText = await page.evaluate(el => el.textContent, errorEl);
            console.log(`ERROR: ${errorText}`);
          }
        } else {
          console.log('No error messages found in viewer');
          
          // Check what type of content is displayed
          const hasImage = await page.evaluate(() => Boolean(document.querySelector('img[src]')));
          const hasPdf = await page.evaluate(() => Boolean(document.querySelector('.react-pdf__Document')));
          const hasVideo = await page.evaluate(() => Boolean(document.querySelector('video')));
          
          console.log('Content detected:', {
            image: hasImage,
            pdf: hasPdf,
            video: hasVideo
          });
          
          // Extract the URL being used
          const fileUrl = await page.evaluate(() => {
            const img = document.querySelector('img[src]');
            if (img) return img.getAttribute('src');
            
            const pdf = document.querySelector('.react-pdf__Document');
            if (pdf) {
              // Try to find URL in data attributes or other properties
              return document.querySelector('iframe')?.src || 'PDF document found but URL not accessible';
            }
            
            const video = document.querySelector('video source');
            if (video) return video.getAttribute('src');
            
            return null;
          });
          
          if (fileUrl) {
            console.log('File URL found:', fileUrl.substring(0, 100) + (fileUrl.length > 100 ? '...' : ''));
            fs.writeFileSync(path.join(outputDir, 'file-url.txt'), fileUrl);
          } else {
            console.log('No file URL could be extracted');
          }
        }
      } else {
        console.log('File viewer element NOT found');
      }
      
      // Click on the Debug Info tab if available
      const debugTab = await page.$('button:has-text("Debug Info")');
      if (debugTab) {
        console.log('Clicking on Debug Info tab');
        await debugTab.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of debug info
        await page.screenshot({ path: path.join(outputDir, '05-debug-info.png'), fullPage: true });
        
        // Extract debug log
        const debugContent = await page.evaluate(() => {
          const debugElements = Array.from(document.querySelectorAll('pre, .MuiTypography-body2'));
          return debugElements.map(el => el.textContent).join('\n');
        });
        
        if (debugContent) {
          console.log('Debug information found:');
          fs.writeFileSync(path.join(outputDir, 'debug-log.txt'), debugContent);
        }
      }
    } else {
      console.log('No file items found to click');
    }
    
    // Final screenshot
    await page.screenshot({ path: path.join(outputDir, '06-final-state.png'), fullPage: true });
    await savePageContent(page, '06-final-state');
    
    console.log('Debug session completed. Results saved to debug-output directory.');
    console.log('Browser will remain open for manual inspection. Press Ctrl+C to exit.');
    
    // Keep the browser open for manual interaction
    // Comment out the browser.close() line below if you want to keep it open
    // await browser.close();
  } catch (error) {
    console.error('Debug session error:', error);
  }
}

// Run the debug session
debugFileRendering().catch(console.error); 
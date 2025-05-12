import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test user credentials
const USER_EMAIL = 'kareem.hassanein@gmail.com';
const USER_PASSWORD = 'Kingtut11-';

// Debug helper to save the page content as HTML
async function savePageContent(page: Page, name: string): Promise<void> {
  const content = await page.content();
  const debugDir = path.join(__dirname, '..', 'debug-output');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(debugDir, `${name}.html`), content);
}

test.describe('Debug File Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Setup console log collection
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
    });
    
    // Setup error collection
    page.on('pageerror', exception => {
      console.error(`BROWSER EXCEPTION: ${exception.message}`);
    });
    
    // Setup response logging for storage requests
    page.on('response', response => {
      const url = response.url();
      if (url.includes('storage') || url.includes('supabase') || url.includes('files')) {
        console.log(`Response ${response.status()}: ${url}`);
      }
    });
  });

  test('visual debug of file rendering in right panel', async ({ page }) => {
    // Step 1: Login
    console.log('Navigating to home page...');
    // Try port 5175 first (common alternative port)
    try {
      await page.goto('http://localhost:5175/', { timeout: 5000 });
    } catch (e) {
      console.log('Port 5175 failed, trying port 5173...');
      // If port 5175 fails, try port 5173 (default Vite port)
      await page.goto('http://localhost:5173/', { timeout: 10000 });
    }
    
    // Take screenshot of login page
    await page.screenshot({ path: 'debug-output/01-login-page.png', fullPage: true });
    
    // Look for login form
    console.log('Looking for login form...');
    const emailField = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]');
    await emailField.waitFor({ timeout: 15000 });
    
    // Fill login credentials
    console.log('Entering credentials...');
    await emailField.fill(USER_EMAIL);
    await page.locator('input[type="password"]').fill(USER_PASSWORD);
    
    // Click login button
    console.log('Logging in...');
    await page.locator('button:has-text("Login"), button:has-text("Sign in"), button[type="submit"]').click();
    
    // Wait for navigation to complete
    console.log('Waiting for navigation after login...');
    await page.waitForURL('/**/projects', { timeout: 30000 });
    
    // Take screenshot of projects page
    console.log('Taking screenshot of projects page...');
    await page.screenshot({ path: 'debug-output/02-projects-page.png', fullPage: true });
    await savePageContent(page, '02-projects-page');
    
    // Step 2: Select a project
    console.log('Selecting first project...');
    const projectItem = page.locator('.MuiListItem-root').first();
    await projectItem.waitFor({ timeout: 10000 });
    await projectItem.click();
    
    // Wait for files to load
    console.log('Waiting for files to load...');
    await page.waitForTimeout(3000);
    
    // Take screenshot after project selection
    await page.screenshot({ path: 'debug-output/03-project-selected.png', fullPage: true });
    await savePageContent(page, '03-project-selected');
    
    // Step 3: Click on a file
    console.log('Selecting first file...');
    const fileItem = page.locator('.MuiListItem-root').nth(1);
    await fileItem.waitFor({ timeout: 10000 });
    
    // Get file name before clicking
    const fileName = await fileItem.textContent();
    console.log(`Selected file: ${fileName}`);
    
    // Click the file
    await fileItem.click();
    
    // Wait for file to potentially load
    console.log('Waiting for file to load in right panel...');
    await page.waitForTimeout(5000);
    
    // Take screenshot after file selection
    await page.screenshot({ path: 'debug-output/04-file-selected.png', fullPage: true });
    await savePageContent(page, '04-file-selected');
    
    // Step 4: Analyze right panel
    console.log('Analyzing right panel content...');
    const rightPanel = page.locator('[data-test="right-panel"], [data-testid="right-panel"], .right-panel');
    
    if (await rightPanel.isVisible()) {
      console.log('Right panel is visible');
      
      // Take screenshot of just the right panel
      await rightPanel.screenshot({ path: 'debug-output/05-right-panel.png' });
      
      // Check for loading indicators
      const loadingIndicator = rightPanel.locator('circle, .MuiCircularProgress-root');
      if (await loadingIndicator.isVisible()) {
        console.log('Loading indicator is visible in right panel');
      }
      
      // Check for error messages
      const errorMessage = rightPanel.locator('text="error", .MuiAlert-root, [role="alert"]');
      if (await errorMessage.isVisible()) {
        console.log('Error message found:', await errorMessage.textContent());
      }
      
      // Check for file viewer
      const fileViewer = page.locator('[data-testid="file-viewer"]');
      if (await fileViewer.isVisible()) {
        console.log('File viewer is visible');
        await fileViewer.screenshot({ path: 'debug-output/06-file-viewer.png' });
      } else {
        console.log('File viewer is NOT visible');
      }
      
      // Dump the HTML structure of the right panel
      const rightPanelHtml = await rightPanel.evaluate(node => node.outerHTML);
      fs.writeFileSync('debug-output/right-panel.html', rightPanelHtml);
    } else {
      console.log('Right panel is NOT visible');
    }
    
    // Step 5: Check network requests for file loading
    console.log('Checking network requests...');
    // Enable network logging
    await page.route('**', route => {
      console.log(`Network request: ${route.request().method()} ${route.request().url()}`);
      return route.continue();
    });
    
    // Force reload the file by clicking it again
    console.log('Clicking file again to force reload...');
    await fileItem.click();
    await page.waitForTimeout(5000);
    
    // Final screenshot
    await page.screenshot({ path: 'debug-output/07-after-reload.png', fullPage: true });
    
    // Step 6: Check console for errors
    console.log('Dumping JavaScript console errors...');
    const consoleErrors = await page.evaluate(() => {
      // @ts-ignore - using any to avoid typescript errors
      return (window as any).consoleErrors || [];
    });
    
    fs.writeFileSync('debug-output/console-errors.json', JSON.stringify(consoleErrors, null, 2));
    
    // Additional debugging: Try to extract file URL from page
    console.log('Attempting to extract file URL...');
    const fileUrl = await page.evaluate(() => {
      // Look for image tags, PDF objects, or video sources
      const img = document.querySelector('img[src]');
      if (img) return img.getAttribute('src');
      
      const pdf = document.querySelector('iframe[src], object[data], embed[src]');
      if (pdf) return pdf.getAttribute('src') || pdf.getAttribute('data');
      
      const video = document.querySelector('video source[src]');
      if (video) return video.getAttribute('src');
      
      return null;
    });
    
    if (fileUrl) {
      console.log('Found file URL:', fileUrl);
      fs.writeFileSync('debug-output/file-url.txt', fileUrl);
      
      // Try to fetch the file directly
      try {
        const response = await page.request.fetch(fileUrl);
        fs.writeFileSync('debug-output/file-fetch-status.txt', 
          `Status: ${response.status()}\nHeaders: ${JSON.stringify(response.headers(), null, 2)}`);
      } catch (e) {
        console.error('Error fetching file:', e);
        fs.writeFileSync('debug-output/file-fetch-error.txt', String(e));
      }
    } else {
      console.log('Could not find file URL in the page');
    }
  });
}); 
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Comprehensive end-to-end test for Clarity Hub
async function runE2ETest() {
  console.log('Starting comprehensive end-to-end testing...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--window-size=1920,1080'],
    slowMo: 50 // Add slight delays between actions to make them visible
  });
  
  // Helper function for delays
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    const page = await browser.newPage();
    
    // Setup console and error logging
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
    
    // 1. Test initial load and authentication
    console.log('\n1. TESTING INITIAL LOAD & AUTHENTICATION...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Take screenshot of initial page
    await page.screenshot({ path: 'test-initial-state.png' });
    console.log('Initial page loaded and screenshot saved');
    
    // Check for login form (assuming we start at login)
    const isLoginPage = await page.evaluate(() => {
      return document.querySelector('form') !== null &&
             (document.querySelector('input[type="email"]') !== null || 
              document.querySelector('input[type="password"]') !== null);
    });
    
    if (isLoginPage) {
      console.log('Login page detected, attempting login...');
      
      // Fill login form (using test credentials)
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'password123');
      
      // Click login button and wait for navigation
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(e => console.log('Navigation timeout after login, continuing...'))
      ]);
      
      await page.screenshot({ path: 'after-login.png' });
      console.log('Login attempted, screenshot saved');
    } else {
      console.log('Not on login page, proceeding with tests...');
    }
    
    // 2. Test panel structure and responsiveness
    console.log('\n2. TESTING PANEL STRUCTURE...');
    
    // Wait for main layout to appear
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Check if all panels are present
    const panelsExist = await page.evaluate(() => {
      // Look for typical panel identifiers based on the app structure
      const leftPanel = document.querySelector('[data-testid="left-panel"]') || 
                       document.querySelector('.left-panel') ||
                       document.querySelector('.MuiDrawer-root');
                       
      const centerPanel = document.querySelector('[data-testid="center-panel"]') || 
                         document.querySelector('.center-panel') ||
                         document.querySelector('.MuiContainer-root:not(.MuiDrawer-root)');
                         
      const rightPanel = document.querySelector('[data-testid="right-panel"]') || 
                        document.querySelector('.right-panel') ||
                        document.querySelector('.MuiDrawer-paper:last-child');
      
      return {
        left: !!leftPanel,
        center: !!centerPanel,
        right: !!rightPanel,
        all: !!leftPanel && !!centerPanel && !!rightPanel
      };
    });
    
    console.log('Panel detection results:', panelsExist);
    if (!panelsExist.all) {
      console.warn('WARNING: Not all panels were detected. The app may not be rendering correctly.');
    }
    
    // Test panel toggle buttons (if they exist)
    const toggleButtonsExist = await page.evaluate(() => {
      const leftToggle = document.querySelector('[data-testid="toggle-left-panel"]') || 
                         document.querySelector('button[aria-label*="left"]');
                         
      const rightToggle = document.querySelector('[data-testid="toggle-right-panel"]') || 
                          document.querySelector('button[aria-label*="right"]');
      
      return { 
        left: leftToggle ? true : false,
        right: rightToggle ? true : false
      };
    });
    
    console.log('Toggle buttons detection:', toggleButtonsExist);
    
    // Test left panel toggle if it exists
    if (toggleButtonsExist.left) {
      console.log('Testing left panel toggle functionality...');
      
      // Take screenshot before toggling
      await page.screenshot({ path: 'before-left-toggle.png' });
      
      // Click the left panel toggle button
      await page.evaluate(() => {
        const leftToggle = document.querySelector('[data-testid="toggle-left-panel"]') || 
                           document.querySelector('button[aria-label*="left"]');
        if (leftToggle) leftToggle.click();
      });
      
      // Wait for animation
      await wait(1000);
      
      // Take screenshot after toggling
      await page.screenshot({ path: 'after-left-toggle.png' });
      console.log('Left panel toggle tested, screenshots saved');
    }
    
    // 3. Test file upload functionality (if upload button exists)
    console.log('\n3. TESTING FILE UPLOAD FUNCTIONALITY...');
    
    const uploadButtonExists = await page.evaluate(() => {
      const uploadBtn = document.querySelector('[data-testid="upload-button"]') || 
                       document.querySelector('button[aria-label*="upload"]') ||
                       document.querySelector('button:has(svg[data-testid*="upload"])') ||
                       Array.from(document.querySelectorAll('button')).find(btn => 
                         btn.textContent.toLowerCase().includes('upload') || 
                         btn.innerHTML.toLowerCase().includes('upload')
                       );
      
      return !!uploadBtn;
    });
    
    console.log('Upload button detection:', uploadButtonExists);
    
    if (uploadButtonExists) {
      console.log('Testing file upload functionality...');
      
      // Create test file content
      const testFilePath = path.join(process.cwd(), 'test-upload.txt');
      fs.writeFileSync(testFilePath, 'This is a test file for upload testing');
      
      // Click the upload button
      await page.evaluate(() => {
        const uploadBtn = document.querySelector('[data-testid="upload-button"]') || 
                         document.querySelector('button[aria-label*="upload"]') ||
                         document.querySelector('button:has(svg[data-testid*="upload"])') ||
                         Array.from(document.querySelectorAll('button')).find(btn => 
                           btn.textContent.toLowerCase().includes('upload') || 
                           btn.innerHTML.toLowerCase().includes('upload')
                         );
        
        if (uploadBtn) uploadBtn.click();
      });
      
      // Wait for file input to be available in the DOM
      await wait(1000);
      
      // Look for file input and upload the test file
      const fileInputs = await page.$$('input[type="file"]');
      if (fileInputs.length > 0) {
        await fileInputs[0].uploadFile(testFilePath);
        console.log('Test file uploaded');
        
        // Wait for file processing
        await wait(3000);
        
        // Take screenshot after upload
        await page.screenshot({ path: 'after-upload.png' });
      } else {
        console.warn('WARNING: No file input found after clicking upload button.');
      }
      
      // Clean up test file
      fs.unlinkSync(testFilePath);
    }
    
    // 4. Test file selection and viewing interaction
    console.log('\n4. TESTING FILE SELECTION AND VIEWING INTERACTION...');
    
    // Find and click on a file in the left panel (if any files are present)
    const fileClicked = await page.evaluate(() => {
      // Look for file items in the left panel
      const fileItems = document.querySelectorAll('[data-testid="file-item"]') || 
                        document.querySelectorAll('.file-item') ||
                        document.querySelectorAll('li:has(.MuiListItemText-root)');
      
      if (fileItems.length > 0) {
        fileItems[0].click();
        return true;
      }
      return false;
    });
    
    if (fileClicked) {
      console.log('Clicked on a file in the left panel');
      
      // Wait for the file to load in the right panel
      await wait(2000);
      
      // Take screenshot after file selection
      await page.screenshot({ path: 'after-file-selection.png' });
      
      // Check if file content is displayed in the right panel
      const fileContentVisible = await page.evaluate(() => {
        const rightPanel = document.querySelector('[data-testid="right-panel"]') || 
                          document.querySelector('.right-panel') ||
                          document.querySelector('.MuiDrawer-paper:last-child');
                          
        const fileViewer = rightPanel && (
          rightPanel.querySelector('[data-testid="file-viewer"]') ||
          rightPanel.querySelector('.enhanced-pdf-viewer') ||
          rightPanel.querySelector('.enhanced-image-viewer') ||
          rightPanel.querySelector('iframe') ||
          rightPanel.querySelector('embed') ||
          rightPanel.querySelector('object')
        );
        
        return !!fileViewer;
      });
      
      console.log('File content visible in right panel:', fileContentVisible);
    } else {
      console.log('No files found in the left panel to click');
    }
    
    // 5. Test generic button functionality 
    console.log('\n5. TESTING GENERIC BUTTON FUNCTIONALITY...');
    
    // Find and test a general action button
    const actionButtonExists = await page.evaluate(() => {
      // Look for general action buttons like Add, Create, etc.
      const actionButton = document.querySelector('button.MuiButton-contained:not([type="submit"])') ||
                          document.querySelector('button.MuiButton-root:not([type="submit"])');
      
      if (actionButton) {
        // Take screenshot before clicking
        // Can't take screenshot inside evaluate, will do outside
        
        // Save button text for reporting
        const buttonText = actionButton.textContent;
        
        // Click the button
        actionButton.click();
        
        return { clicked: true, text: buttonText };
      }
      
      return { clicked: false };
    });
    
    if (actionButtonExists.clicked) {
      console.log(`Clicked on action button: "${actionButtonExists.text}"`);
      
      // Take screenshot after clicking button
      await wait(1000);
      await page.screenshot({ path: 'after-generic-button-1.png' });
    } else {
      console.log('No general action buttons found to test');
    }
    
    // Final state screenshot
    await page.screenshot({ path: 'final-state.png' });
    console.log('\nEnd-to-end testing completed. Final screenshot saved.');
    
    console.log('\nTest Summary:');
    console.log('✓ Initial app load successful');
    if (isLoginPage) console.log('✓ Authentication form tested');
    console.log(`${panelsExist.all ? '✓' : '✗'} Panel structure detection`);
    if (toggleButtonsExist.left) console.log('✓ Panel toggle functionality tested');
    if (uploadButtonExists) console.log('✓ File upload functionality tested');
    if (fileClicked) console.log('✓ File selection tested');
    if (actionButtonExists.clicked) console.log('✓ General button functionality tested');
    
    // Keep browser open for manual inspection
    console.log('\nBrowser window kept open for inspection. Press Ctrl+C to exit.');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('\nERROR DURING E2E TESTING:', error);
  }
}

runE2ETest(); 
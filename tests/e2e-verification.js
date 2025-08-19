const playwright = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * E2E verification script for Clarity Hub application
 * This script runs automated checks to verify core functionality
 */
async function verifyApp() {
  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  console.log('🧪 Starting automated verification...');
  
  // Launch browser
  const browser = await playwright.chromium.launch({
    headless: false, // Set to true for headless operation
    slowMo: 100, // Slow down operations for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: resultsDir,
      size: { width: 1280, height: 720 },
    },
  });
  
  // Create page and navigate to the app
  const page = await context.newPage();
  console.log('📱 Browser launched, navigating to app...');
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    console.log('✅ App loaded successfully');
    
    // Wait for app initialization (look for a known element)
    await page.waitForSelector('[data-test="left-panel"]', { timeout: 10000 });
    console.log('✅ Left panel detected');
    
    // Take screenshot of initial state
    await page.screenshot({ path: path.join(resultsDir, 'initial-state.png') });
    console.log('📸 Initial state screenshot captured');
    
    // Verify demo projects are loaded
    const projectsCount = await page.$$eval('.MuiListItem-root', items => {
      // Filter to only include project items
      return items.filter(item => 
        item.textContent.includes('Acme Corp') || 
        item.textContent.includes('Smith Estate')
      ).length;
    });
    
    console.log(`🔍 Found ${projectsCount} projects in the panel`);
    if (projectsCount >= 1) {
      console.log('✅ Projects loaded correctly');
    } else {
      console.log('❌ Projects not loaded correctly');
    }

    // Select a project
    const projectSelector = '.MuiListItem-root:has-text("Acme Corp")';
    await page.waitForSelector(projectSelector);
    await page.click(projectSelector);
    console.log('👆 Clicked on a project');
    
    // Wait for files to load
    await page.waitForTimeout(500);
    
    // Verify files loaded for project
    const filesCount = await page.$$eval('[data-testid^="file-item-"]', files => files.length);
    console.log(`🔍 Found ${filesCount} files for the selected project`);
    
    if (filesCount > 0) {
      console.log('✅ Files loaded correctly');
      
      // Click on a file
      await page.click('[data-testid^="file-item-"]:first-child');
      console.log('👆 Clicked on a file');
      
      // Wait for the file viewer to load
      await page.waitForTimeout(500);
      
      // Take screenshot of file viewer
      await page.screenshot({ path: path.join(resultsDir, 'file-viewer.png') });
      console.log('📸 File viewer screenshot captured');
    } else {
      console.log('❌ No files found for the project');
    }
    
    // Test panel resizing
    const leftPanelResizer = '[data-test="left-panel"] + div[style*="cursor: col-resize"]';
    try {
      await page.waitForSelector(leftPanelResizer, { timeout: 5000 });
      
      // Get current panel widths
      const initialWidths = await page.evaluate(() => {
        const panels = document.querySelectorAll('[data-test="left-panel"], [data-test="center-panel"], [data-test="right-panel"]');
        return Array.from(panels).map(panel => panel.getBoundingClientRect().width);
      });
      
      console.log('📏 Initial panel widths:', initialWidths);
      
      // Drag the resizer to change panel sizes
      await page.mouse.move(300, 400);
      await page.mouse.down();
      await page.mouse.move(400, 400);
      await page.mouse.up();
      
      // Get new panel widths
      const newWidths = await page.evaluate(() => {
        const panels = document.querySelectorAll('[data-test="left-panel"], [data-test="center-panel"], [data-test="right-panel"]');
        return Array.from(panels).map(panel => panel.getBoundingClientRect().width);
      });
      
      console.log('📏 New panel widths after resize:', newWidths);
      
      if (JSON.stringify(initialWidths) !== JSON.stringify(newWidths)) {
        console.log('✅ Panel resizing works');
      } else {
        console.log('❌ Panel resizing doesn\'t appear to work');
      }
    } catch (error) {
      console.log('❌ Could not find panel resizer:', error.message);
    }
    
    // Test editor functionality
    const editorSelector = 'textarea';
    try {
      await page.waitForSelector(editorSelector);
      
      // Type some text into the editor
      await page.click(editorSelector);
      await page.type(editorSelector, '\n\n## New Test Section\nThis is verification text added by automation.');
      
      console.log('✅ Editor is functional');
      
      // Take screenshot of editor with added text
      await page.screenshot({ path: path.join(resultsDir, 'editor-test.png') });
      console.log('📸 Editor test screenshot captured');
    } catch (error) {
      console.log('❌ Could not interact with editor:', error.message);
    }
    
    // Test debug mode activation (Ctrl+Shift+D)
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('KeyD');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    
    // Check if debug button appears
    const debugButtonVisible = await page.isVisible('button:has-text("Reset App")');
    
    if (debugButtonVisible) {
      console.log('✅ Debug mode activated successfully');
      
      // Take screenshot of debug mode
      await page.screenshot({ path: path.join(resultsDir, 'debug-mode.png') });
      console.log('📸 Debug mode screenshot captured');
      
      // Click the reset button
      await page.click('button:has-text("Reset App")');
      console.log('👆 Clicked Reset App button');
      
      // Wait for reset to complete and page to reload
      await page.waitForNavigation({ timeout: 10000 });
      console.log('✅ App reset completed successfully');
    } else {
      console.log('❌ Debug mode not activated or button not visible');
    }
    
    console.log('\n🎉 Verification tests completed!');
    console.log(`📊 Results saved to: ${resultsDir}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    
    // Capture error state
    await page.screenshot({ path: path.join(resultsDir, 'error-state.png') });
    console.log(`📸 Error state screenshot saved to: ${path.join(resultsDir, 'error-state.png')}`);
  } finally {
    // Close browser
    await browser.close();
  }
}

// Auto-execute if run directly
if (require.main === module) {
  verifyApp().catch(console.error);
}

module.exports = verifyApp;
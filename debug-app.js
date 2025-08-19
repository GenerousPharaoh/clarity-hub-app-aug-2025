import puppeteer from 'puppeteer';

(async () => {
  // Launch browser in non-headless mode to see what's happening
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100, // Slow down operations to see what's happening
    defaultViewport: null, // Use default viewport of browser
    args: ['--start-maximized'] // Start with maximized browser window
  });
  
  const page = await browser.newPage();
  
  // Helper function for waiting
  const wait = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  try {
    console.log('Debugging Clarity Hub app issues...');
    
    // Navigate directly to the test layout page
    await page.goto('http://localhost:3000/test-layout');
    console.log('✅ Navigated to test layout page');
    
    // Wait for app to load
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Take a screenshot of initial state
    await page.screenshot({ path: 'test-layout-initial.png' });
    console.log('✅ Took initial screenshot');
    
    // Check for panel elements
    const panelInfo = await page.evaluate(() => {
      const leftPanel = document.querySelector('[data-test="left-panel-container"]');
      const centerPanel = document.querySelector('[data-test="center-panel-container"]');
      const rightPanel = document.querySelector('[data-test="right-panel-container"]');
      
      return {
        hasLeftPanel: !!leftPanel,
        hasCenterPanel: !!centerPanel,
        hasRightPanel: !!rightPanel,
        leftWidth: leftPanel?.offsetWidth || 0,
        centerWidth: centerPanel?.offsetWidth || 0,
        rightWidth: rightPanel?.offsetWidth || 0,
      };
    });
    
    console.log('Panel Info:', JSON.stringify(panelInfo, null, 2));
    
    // Test clicking the left panel toggle button
    console.log('Testing left panel toggle button...');
    await page.screenshot({ path: 'before-left-toggle.png' });
    
    const leftToggleButton = await page.$('[data-test="left-panel-toggle-button"]');
    if (leftToggleButton) {
      await leftToggleButton.click();
      await wait(1000);
      await page.screenshot({ path: 'after-left-toggle.png' });
      
      // Check panel sizes after toggle
      const afterLeftToggle = await page.evaluate(() => {
        const leftPanel = document.querySelector('[data-test="left-panel-container"]');
        return {
          leftWidth: leftPanel?.offsetWidth || 0,
          isCollapsed: leftPanel?.offsetWidth < 100
        };
      });
      
      console.log('After left toggle:', JSON.stringify(afterLeftToggle, null, 2));
      
      // Toggle back
      await leftToggleButton.click();
      await wait(1000);
      await page.screenshot({ path: 'after-left-toggle-back.png' });
    } else {
      console.log('❌ Could not find left panel toggle button');
    }
    
    // Test clicking the right panel toggle button
    console.log('Testing right panel toggle button...');
    await page.screenshot({ path: 'before-right-toggle.png' });
    
    const rightToggleButton = await page.$('[data-test="right-panel-toggle-button"]');
    if (rightToggleButton) {
      await rightToggleButton.click();
      await wait(1000);
      await page.screenshot({ path: 'after-right-toggle.png' });
      
      // Check panel sizes after toggle
      const afterRightToggle = await page.evaluate(() => {
        const rightPanel = document.querySelector('[data-test="right-panel-container"]');
        return {
          rightWidth: rightPanel?.offsetWidth || 0,
          isCollapsed: rightPanel?.offsetWidth < 100
        };
      });
      
      console.log('After right toggle:', JSON.stringify(afterRightToggle, null, 2));
      
      // Toggle back
      await rightToggleButton.click();
      await wait(1000);
      await page.screenshot({ path: 'after-right-toggle-back.png' });
    } else {
      console.log('❌ Could not find right panel toggle button');
    }
    
    // Test clicking the increment button
    console.log('Testing increment button...');
    
    const incrementButton = await page.$('button:has-text("Increment")');
    if (incrementButton) {
      // Click the increment button 3 times
      for (let i = 0; i < 3; i++) {
        await incrementButton.click();
        await wait(500);
      }
      
      await page.screenshot({ path: 'after-increment.png' });
      
      // Check the counter value
      const counterValue = await page.evaluate(() => {
        const counterText = document.querySelector('h3')?.innerText || '';
        const match = counterText.match(/Counter: (\d+)/);
        return match ? parseInt(match[1], 10) : null;
      });
      
      console.log(`Counter value after clicking: ${counterValue}`);
    } else {
      console.log('❌ Could not find increment button');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-layout-final.png' });
    console.log('✅ Test completed successfully');
    
    // Set up console logging event handlers
    page.on('console', msg => {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    // Check for exceptions
    page.on('pageerror', error => {
      console.log(`❌ Page error: ${error.message}`);
    });
    
    // Wait for 10 seconds before closing
    console.log('Debug session completed successfully. Press Ctrl+C to end the session.');
    await wait(10000);
    
  } catch (error) {
    console.error('Debug script error:', error);
  } finally {
    await browser.close();
    console.log('Debug session ended');
  }
})(); 
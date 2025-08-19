import puppeteer from 'puppeteer';

async function checkApp() {
  // Launch a new browser instance
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    // Open a new page
    const page = await browser.newPage();
    
    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Get page title and body content
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Capture console logs from the browser
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE: [${msg.type()}] ${msg.text()}`);
    });
    
    page.on('pageerror', err => {
      console.error(`PAGE ERROR: ${err.message}`);
    });
    
    // Take screenshot
    await page.screenshot({ path: 'app-status.png', fullPage: true });
    console.log('Screenshot saved to app-status.png');
    
    // Check DOM structure
    const domInfo = await page.evaluate(() => {
      return {
        bodyHTML: document.body.innerHTML.substring(0, 150) + '...',
        hasRootElement: !!document.getElementById('root'),
        rootChildren: document.getElementById('root') ? document.getElementById('root').children.length : 0,
        visiblePanels: Array.from(document.querySelectorAll('[data-test]')).map(el => el.getAttribute('data-test')),
        isLeftPanelVisible: !!document.querySelector('[data-test="left-panel"]'),
        isRightPanelVisible: !!document.querySelector('[data-test="right-panel"]'),
        isCenterPanelVisible: !!document.querySelector('[data-test="center-panel"]'),
        errors: Array.from(document.querySelectorAll('.MuiAlert-standardError')).map(err => err.textContent)
      };
    });
    
    console.log('\nDOM Info:');
    console.log('- Has Root Element:', domInfo.hasRootElement);
    console.log('- Root Children:', domInfo.rootChildren);
    console.log('- Visible Panels:', domInfo.visiblePanels);
    console.log('- Left Panel Visible:', domInfo.isLeftPanelVisible);
    console.log('- Center Panel Visible:', domInfo.isCenterPanelVisible);
    console.log('- Right Panel Visible:', domInfo.isRightPanelVisible);
    
    if (domInfo.errors.length > 0) {
      console.log('\nDetected Errors in UI:');
      domInfo.errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
    } else {
      console.log('\nNo visible errors detected in UI');
    }
    
    // Try to interact with the app
    console.log('\nTesting basic interactions...');
    
    // Test toggle buttons
    const toggleButtons = await page.$$('[data-test*="fold"]');
    if (toggleButtons.length > 0) {
      console.log(`Found ${toggleButtons.length} toggle buttons`);
      await toggleButtons[0].click();
      console.log('Clicked first toggle button');
      
      // Take another screenshot after interaction
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'after-toggle.png' });
      console.log('Screenshot after toggle saved to after-toggle.png');
    } else {
      console.log('No toggle buttons found');
    }
    
    // Wait for manual inspection
    console.log('\nApp check complete. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to exit the script');
    
    // Prevent the script from exiting so the browser stays open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error during app check:', error);
  }
}

// Run the check
checkApp(); 
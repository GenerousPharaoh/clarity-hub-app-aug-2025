import puppeteer from 'puppeteer';

async function checkEnvironment() {
  console.log('Starting environment check...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--window-size=1280,800']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => console.log(`BROWSER: ${msg.type().toUpperCase()} - ${msg.text()}`));
    page.on('pageerror', err => console.error(`PAGE ERROR: ${err.message}`));
    
    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Page loaded, checking render status...');
    
    // Check for successful rendering
    const appState = await page.evaluate(() => {
      // Check for error messages
      const errorElements = document.querySelectorAll('.MuiAlert-root.MuiAlert-standardError');
      const errorMessages = Array.from(errorElements).map(el => el.textContent);
      
      // Check for visible content
      const hasContent = document.body.textContent.trim().length > 0;
      const hasRoot = !!document.getElementById('root');
      const rootContent = hasRoot ? document.getElementById('root').innerHTML.length : 0;
      
      // Check for specific app elements
      const hasAppBar = !!document.querySelector('.MuiAppBar-root');
      const hasDrawer = !!document.querySelector('.MuiDrawer-root');
      const hasMainContent = !!document.querySelector('main');
      
      // Get document title
      const title = document.title;
      
      return {
        title,
        hasContent,
        hasRoot,
        rootContent,
        hasAppBar,
        hasDrawer,
        hasMainContent,
        errorMessages,
        isErrorState: errorMessages.length > 0,
        bodyClasses: document.body.className,
        loadStatus: document.readyState
      };
    });
    
    console.log('\nApp Render Status:');
    console.log('-----------------');
    console.log(`Title: ${appState.title}`);
    console.log(`Document ready state: ${appState.loadStatus}`);
    console.log(`Has content: ${appState.hasContent}`);
    console.log(`Root element present: ${appState.hasRoot}`);
    console.log(`Root content length: ${appState.rootContent}`);
    console.log(`Body classes: ${appState.bodyClasses}`);
    console.log('\nApp Components:');
    console.log(`- AppBar: ${appState.hasAppBar ? 'PRESENT' : 'MISSING'}`);
    console.log(`- Drawer: ${appState.hasDrawer ? 'PRESENT' : 'MISSING'}`);
    console.log(`- Main Content: ${appState.hasMainContent ? 'PRESENT' : 'MISSING'}`);
    
    if (appState.errorMessages.length > 0) {
      console.log('\nError Messages:');
      appState.errorMessages.forEach((msg, i) => {
        console.log(`  ${i+1}. ${msg}`);
      });
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-layout-initial.png', fullPage: true });
    console.log('\nScreenshot saved to test-layout-initial.png');
    
    // Test if panels exist and are functioning
    const panelStructure = await page.evaluate(() => {
      // Look for panels using common selectors
      const panels = {
        left: document.querySelector('.left-panel') || 
              document.querySelector('[data-testid="left-panel"]') ||
              document.querySelector('.MuiDrawer-root'),
        right: document.querySelector('.right-panel') || 
               document.querySelector('[data-testid="right-panel"]') ||
               document.querySelector('.MuiDrawer-paper:last-child')
      };
      
      return {
        leftPanel: panels.left ? {
          exists: true,
          visible: window.getComputedStyle(panels.left).display !== 'none',
          width: panels.left.getBoundingClientRect().width
        } : { exists: false },
        rightPanel: panels.right ? {
          exists: true,
          visible: window.getComputedStyle(panels.right).display !== 'none',
          width: panels.right.getBoundingClientRect().width
        } : { exists: false }
      };
    });
    
    console.log('\nPanel Structure:');
    console.log('-----------------');
    console.log('Left Panel:', panelStructure.leftPanel.exists 
                ? `PRESENT (${panelStructure.leftPanel.visible ? 'visible' : 'hidden'}, width: ${panelStructure.leftPanel.width}px)` 
                : 'MISSING');
    console.log('Right Panel:', panelStructure.rightPanel.exists 
                ? `PRESENT (${panelStructure.rightPanel.visible ? 'visible' : 'hidden'}, width: ${panelStructure.rightPanel.width}px)` 
                : 'MISSING');
    
    // Wait for manual inspection
    console.log('\nEnvironment check complete. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to exit');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error during environment check:', error);
  }
}

checkEnvironment(); 
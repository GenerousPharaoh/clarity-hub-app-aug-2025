import puppeteer from 'puppeteer';

async function verifyApp() {
  console.log('Starting app verification...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--window-size=1920,1080', '--auto-open-devtools-for-tabs']
  });
  
  // Helper function since page.waitForTimeout may not be available
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    const page = await browser.newPage();
    
    // Capture console logs with source information
    const consoleMessages = [];
    page.on('console', async (msg) => {
      const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        args: args,
        location: msg.location()
      });
    });
    
    // Capture errors
    page.on('error', err => {
      console.error('Page error:', err);
    });
    
    page.on('pageerror', err => {
      console.error('Uncaught exception:', err);
    });
    
    // Enable detailed request/response logging
    page.on('request', request => {
      if (request.resourceType() === 'script' || request.resourceType() === 'stylesheet') {
        console.log(`Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('requestfailed', request => {
      console.error(`Request failed: ${request.url()}`, request.failure());
    });
    
    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`Response failed: ${response.url()} - ${response.status()}`);
      }
    });
    
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the app to load
    await page.waitForSelector('body', { timeout: 10000 });
    await wait(2000);
    
    // Capture the HTML structure of the page
    const htmlStructure = await page.evaluate(() => {
      return {
        title: document.title,
        bodyChildren: Array.from(document.body.children).map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          children: el.childNodes.length
        })),
        rootElement: document.getElementById('root') ? {
          children: Array.from(document.getElementById('root').children).map(el => ({
            tagName: el.tagName,
            className: el.className
          }))
        } : null,
        errors: document.querySelectorAll('.vite-error-overlay').length > 0 ? 
          Array.from(document.querySelectorAll('.vite-error-overlay')).map(el => el.textContent) :
          null
      };
    });
    
    console.log('HTML Structure:', JSON.stringify(htmlStructure, null, 2));
    
    // Print console errors
    console.log('Console messages during page load:');
    consoleMessages.filter(msg => msg.type === 'error').forEach((msg, i) => {
      console.error(`${i+1}. ERROR: ${msg.text}`);
      if (msg.location && msg.location.url) {
        console.error(`   Source: ${msg.location.url}:${msg.location.lineNumber}`);
      }
    });
    
    // Try to navigate to different routes and see if they load
    const routes = [
      { path: '/', name: 'Home' },
      { path: '/auth/login', name: 'Login' },
      { path: '/auth/register', name: 'Register' }
    ];
    
    for (const route of routes) {
      console.log(`\nNavigating to ${route.name} route: ${route.path}...`);
      await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'networkidle2' });
      await wait(1000);
      
      // Take a screenshot
      await page.screenshot({ path: `route-${route.name.toLowerCase()}.png` });
      console.log(`Screenshot captured for ${route.name} route`);
      
      // Check for errors
      const hasErrors = await page.evaluate(() => {
        return document.querySelectorAll('.vite-error-overlay').length > 0;
      });
      
      if (hasErrors) {
        console.error(`Errors detected on ${route.name} route`);
      } else {
        console.log(`${route.name} route loaded successfully`);
      }
    }
    
    // Take screenshots
    await page.screenshot({ path: 'app-debug.png' });
    console.log('\nApp verification completed. Screenshots saved.');
    
    // Wait for user to close the browser
    console.log('Browser window is open for inspection. Press Ctrl+C to exit.');
    await new Promise(() => {}); // Keep browser open
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    // Browser will stay open for manual inspection
  }
}

verifyApp(); 
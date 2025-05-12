import { test, expect } from '@playwright/test';

test.describe('UI Navigation and Appearance', () => {
  test('Navigation and UI elements in demo mode', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/');
    
    // Wait for the page to load
    await page.waitForSelector('.MuiBox-root');
    
    // Take a screenshot of the initial page
    await page.screenshot({ path: 'test-results/ui-initial-view.png' });
    
    // Enter demo mode
    const skipLoginButton = page.locator('button:has-text("Skip Login (Demo Mode)")');
    if (await skipLoginButton.count() > 0) {
      await skipLoginButton.click();
      
      // Wait for the app to load after login
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/ui-after-login.png' });
      
      // Check for the main UI components
      const leftPanelExists = await page.locator('.MuiDrawer-root, [data-test="left-panel"]').count() > 0;
      
      if (leftPanelExists) {
        console.log('Left panel detected - app loaded correctly');
      }
      
      // Look for any navigation tabs or buttons
      const tabs = await page.locator('.MuiTab-root, [role="tab"]').count();
      if (tabs > 0) {
        console.log(`Found ${tabs} navigation tabs`);
        
        // Try clicking each tab (except the first one which is usually already selected)
        for (let i = 1; i < Math.min(tabs, 5); i++) {
          try {
            await page.locator('.MuiTab-root, [role="tab"]').nth(i).click({ timeout: 2000 });
            await page.waitForTimeout(500);
            await page.screenshot({ path: `test-results/ui-tab-${i}.png` });
          } catch (e) {
            console.log(`Unable to click tab ${i}`);
          }
        }
      }
      
      // Check for toolbar buttons
      const toolbarButtons = await page.locator('.MuiToolbar-root button').count();
      console.log(`Found ${toolbarButtons} toolbar buttons`);
      
      // Test window resizing and responsive UI
      for (const width of [800, 1024, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: `test-results/ui-responsive-${width}.png` });
      }
      
      // Try to interact with the application using keyboard shortcuts
      await page.keyboard.press('Escape'); // Often used to close dialogs
      await page.waitForTimeout(500);
      
      // Try searching if a search field exists
      const searchField = page.locator('input[placeholder*="Search"], input[aria-label*="search"]');
      if (await searchField.count() > 0) {
        await searchField.fill('test');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/ui-search.png' });
      }
    } else {
      console.log('Skip login button not found - using default login flow');
      // Just verify the login screen components are present
      const loginForm = await page.locator('form, [data-test="login-form"]').count() > 0;
      expect(loginForm).toBeTruthy();
    }
  });
  
  test('Dark mode toggle if available', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/');
    
    // Wait for the page to load
    await page.waitForSelector('.MuiBox-root');
    
    // Enter demo mode if button exists
    const skipLoginButton = page.locator('button:has-text("Skip Login (Demo Mode)")');
    if (await skipLoginButton.count() > 0) {
      await skipLoginButton.click();
      await page.waitForTimeout(1000);
      
      // Look for a theme toggle button (common in Material UI apps)
      const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="dark mode"]');
      if (await themeToggle.count() > 0) {
        // Take a screenshot before toggling
        await page.screenshot({ path: 'test-results/ui-before-theme-toggle.png' });
        
        // Click the theme toggle
        await themeToggle.click();
        await page.waitForTimeout(1000);
        
        // Take a screenshot after toggling
        await page.screenshot({ path: 'test-results/ui-after-theme-toggle.png' });
        
        console.log('Successfully toggled theme mode');
      } else {
        console.log('No theme toggle button found');
      }
    }
  });
}); 
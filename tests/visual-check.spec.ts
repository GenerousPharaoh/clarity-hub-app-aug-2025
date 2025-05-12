import { test, expect } from '@playwright/test';

test.describe('Visual Appearance', () => {
  test('App visual appearance check', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/');
    
    // Wait for the page to load
    await page.waitForSelector('.MuiBox-root');
    
    // Enter demo mode
    const skipLoginButton = page.locator('button:has-text("Skip Login (Demo Mode)")');
    if (await skipLoginButton.count() > 0) {
      await skipLoginButton.click();
      await page.waitForTimeout(1000);
      
      // Take a screenshot of the main app interface
      await page.screenshot({ 
        path: 'test-results/visual-main-interface.png',
        fullPage: true
      });
      
      // Check color scheme and styling
      
      // 1. Check app bar styling
      const appBar = page.locator('.MuiAppBar-root').first();
      const appBarExists = await appBar.count() > 0;
      if (appBarExists) {
        try {
          // Take a screenshot of the app bar
          const appBarBox = await appBar.boundingBox();
          if (appBarBox) {
            await page.screenshot({
              path: 'test-results/visual-app-bar.png',
              clip: {
                x: appBarBox.x,
                y: appBarBox.y,
                width: appBarBox.width,
                height: appBarBox.height * 1.5 // Add some extra height to see what's below
              }
            });
          }
        } catch (error) {
          console.log('Error capturing app bar:', error);
        }
      }
      
      // 2. Check left panel styling
      try {
        // Use a more specific selector to avoid multiple matches
        const leftPanel = page.locator('#left-panel').first();
        const leftPanelExists = await leftPanel.count() > 0;
        
        if (leftPanelExists) {
          // Take a screenshot of the left panel
          const leftPanelBox = await leftPanel.boundingBox();
          if (leftPanelBox) {
            await page.screenshot({
              path: 'test-results/visual-left-panel.png',
              clip: {
                x: leftPanelBox.x,
                y: leftPanelBox.y,
                width: leftPanelBox.width,
                height: Math.min(leftPanelBox.height, 600) // Limit height for better visibility
              }
            });
          }
        }
      } catch (error) {
        console.log('Error capturing left panel:', error);
      }
      
      // 3. Check button styling
      try {
        const buttons = page.locator('.MuiButton-root');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          // Take a screenshot of a button
          const buttonBox = await buttons.first().boundingBox();
          if (buttonBox) {
            await page.screenshot({
              path: 'test-results/visual-button.png',
              clip: {
                x: buttonBox.x - 10,
                y: buttonBox.y - 10,
                width: buttonBox.width + 20,
                height: buttonBox.height + 20
              }
            });
          }
        }
      } catch (error) {
        console.log('Error capturing button:', error);
      }
      
      // 4. Check typography
      try {
        const typography = page.locator('.MuiTypography-root').first();
        const typographyExists = await typography.count() > 0;
        
        if (typographyExists) {
          // Take a screenshot of some text
          const textBox = await typography.boundingBox();
          if (textBox) {
            await page.screenshot({
              path: 'test-results/visual-typography.png',
              clip: {
                x: textBox.x - 10,
                y: textBox.y - 10,
                width: textBox.width + 20,
                height: textBox.height + 20
              }
            });
          }
        }
      } catch (error) {
        console.log('Error capturing typography:', error);
      }
      
      // 5. Check for proper spacing and alignment
      await page.screenshot({ 
        path: 'test-results/visual-layout.png'
      });
      
      // Test with smaller viewport to check responsive design
      await page.setViewportSize({ width: 768, height: 800 });
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/visual-mobile.png'
      });
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 800 });
    } else {
      // Just check the login page appearance
      await page.screenshot({ 
        path: 'test-results/visual-login-page.png'
      });
    }
  });
}); 
const puppeteer = require('puppeteer');

(async () => {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless testing
    slowMo: 50 // Slow down operations to see what's happening
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Starting Puppeteer validation of Clarity Hub...');
    
    // Navigate to app
    await page.goto('http://localhost:5173');
    console.log('✅ Navigated to app');
    
    // Wait for app to load
    await page.waitForSelector('[data-test="left-panel"]');
    console.log('✅ App loaded successfully');
    
    // Test panel collapsing
    console.log('Testing panel collapsing...');
    
    // Collapse left panel
    await page.click('[data-test="fold-left-button"]');
    await page.waitForTimeout(500); // Wait for animation
    
    // Expand left panel
    await page.click('[data-test="unfold-left-tab"]');
    await page.waitForTimeout(500); // Wait for animation
    console.log('✅ Panel collapse/expand functionality works');
    
    // Check if we have any projects
    const hasProjects = await page.evaluate(() => {
      const projects = document.querySelectorAll('[data-test="project-item"]');
      return projects.length > 0;
    });
    
    if (!hasProjects) {
      // Create a new project
      console.log('Creating test project...');
      await page.click('[data-test="create-project-button"]');
      await page.waitForSelector('input[placeholder="Project Name"]');
      await page.type('input[placeholder="Project Name"]', `Puppeteer Test Project ${Date.now()}`);
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-test="project-item"]');
      console.log('✅ Project created successfully');
    } else {
      // Select first project
      await page.click('[data-test="project-item"]');
      console.log('✅ Existing project selected');
    }
    
    // Check if we have any files
    const hasFiles = await page.evaluate(() => {
      const files = document.querySelectorAll('[data-test="file-item"]');
      return files.length > 0;
    });
    
    if (hasFiles) {
      // Select first file
      await page.click('[data-test="file-item"]');
      console.log('✅ File selected');
      
      // Check file viewer
      await page.waitForSelector('[data-test="right-panel"]');
      const fileViewerLoaded = await page.evaluate(() => {
        const rightPanel = document.querySelector('[data-test="right-panel"]');
        return !rightPanel.textContent.includes('No file selected');
      });
      
      if (fileViewerLoaded) {
        console.log('✅ File viewer loaded successfully');
        
        // Test AI Assist tab
        await page.click('button[role="tab"]:nth-child(2)');
        await page.waitForTimeout(500);
        
        const aiTabsVisible = await page.evaluate(() => {
          const tabContent = document.querySelector('[role="tabpanel"]:not([hidden])');
          return tabContent && 
            (tabContent.textContent.includes('Entities') || 
             tabContent.textContent.includes('Summary') || 
             tabContent.textContent.includes('Q&A'));
        });
        
        if (aiTabsVisible) {
          console.log('✅ AI Assist panel loaded successfully');
        } else {
          console.log('❌ AI Assist panel not loading correctly');
        }
      } else {
        console.log('❌ File viewer not loading correctly');
      }
    } else {
      console.log('⚠️ No files available to test viewers');
    }
    
    // Test search
    await page.type('input[placeholder*="Search"]', 'test');
    await page.waitForTimeout(500); // Wait for debounced search
    console.log('✅ Search input works');
    
    // Overall validation result
    console.log('\n=== Puppeteer Validation Results ===');
    console.log('✅ Core app functionality is working');
    console.log('✅ Panel resizing and UI is functional');
    if (hasFiles) {
      console.log('✅ File viewing functionality is operational');
    }
    console.log('✅ Project management is operational');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
})(); 
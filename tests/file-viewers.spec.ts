import { test, expect } from '@playwright/test';

test.describe('File Viewer Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Ensure the app is loaded by waiting for the left panel
    await page.waitForSelector('[data-test="left-panel"]');
    
    // Create a test project if needed and select a file
    await setupTestEnvironment(page);
  });

  test('PDF viewer should load and display controls', async ({ page }) => {
    // Select a PDF file
    await selectFileByType(page, 'pdf');
    
    // Check that the PDF viewer has loaded
    await page.waitForSelector('.react-pdf__Document');
    
    // Verify basic controls are present
    await expect(page.locator('button[title="Zoom in"]')).toBeVisible();
    await expect(page.locator('button[title="Zoom out"]')).toBeVisible();
    await expect(page.locator('button[title="Rotate left"]')).toBeVisible();
    await expect(page.locator('button[title="Rotate right"]')).toBeVisible();
    
    // Test zoom functionality
    const initialScale = await getZoomLevel(page);
    await page.locator('button[title="Zoom in"]').click();
    await page.waitForTimeout(300); // Wait for zoom to apply
    const newScale = await getZoomLevel(page);
    expect(newScale).toBeGreaterThan(initialScale);
    
    // Test page navigation if there are multiple pages
    const pageInput = page.locator('input[type="text"][value="1"]');
    if (await pageInput.isVisible()) {
      await pageInput.click();
      await pageInput.fill('2');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300); // Wait for page to change
      await expect(pageInput).toHaveValue('2');
    }
  });

  test('Image viewer should load and support zoom and rotation', async ({ page }) => {
    // Select an image file
    await selectFileByType(page, 'image');
    
    // Check that the image viewer has loaded
    await page.waitForSelector('img');
    
    // Verify basic controls are present
    await expect(page.locator('button[title="Zoom in"]')).toBeVisible();
    await expect(page.locator('button[title="Zoom out"]')).toBeVisible();
    await expect(page.locator('button[title="Rotate left"]')).toBeVisible();
    await expect(page.locator('button[title="Rotate right"]')).toBeVisible();
    await expect(page.locator('button[title="Reset view"]')).toBeVisible();
    
    // Test rotation
    const image = page.locator('img');
    const initialTransform = await image.evaluate((el) => 
      window.getComputedStyle(el.parentElement).transform
    );
    
    await page.locator('button[title="Rotate right"]').click();
    await page.waitForTimeout(300); // Wait for rotation to apply
    
    const newTransform = await image.evaluate((el) => 
      window.getComputedStyle(el.parentElement).transform
    );
    
    expect(newTransform).not.toEqual(initialTransform);
    
    // Test reset view
    await page.locator('button[title="Reset view"]').click();
    await page.waitForTimeout(300);
    
    const resetTransform = await image.evaluate((el) => 
      window.getComputedStyle(el.parentElement).transform
    );
    
    expect(resetTransform).not.toEqual(newTransform);
  });

  test('Audio/Video viewer should have playback controls', async ({ page }) => {
    // Select an audio or video file
    await selectFileByType(page, 'video');
    
    // Check that the audio/video player has loaded (may be audio or video element)
    await Promise.race([
      page.waitForSelector('video'),
      page.waitForSelector('audio')
    ]);
    
    // Verify basic controls are present
    await expect(page.locator('button[aria-label="Play"]')).toBeVisible();
    await expect(page.locator('div[role="slider"]')).toBeVisible(); // Progress slider
    
    // Test play button
    await page.locator('button[aria-label="Play"]').click();
    await page.waitForTimeout(1000); // Let it play for a moment
    
    // Verify time has advanced (current time should be > 0)
    const timeDisplay = page.locator('text=/^0:0[1-9]/');
    await expect(timeDisplay).toBeVisible();
    
    // Test copy timestamp link
    const copyButton = page.locator('button[title="Copy link to timestamp"]');
    if (await copyButton.isVisible()) {
      await copyButton.click();
      // Should show a notification about successful copy
      await expect(page.locator('text=Link copied')).toBeVisible();
    }
  });

  test('Right panel tabs should switch between viewer and AI assist', async ({ page }) => {
    // Select any file
    await selectAnyFile(page);
    
    // Verify we're on the View tab by default
    await expect(page.locator('button[role="tab"][aria-selected="true"]')).toContainText('View');
    
    // Switch to AI Assist tab
    await page.locator('button[role="tab"]').nth(1).click();
    
    // Verify AI Assist tab is now selected
    await expect(page.locator('button[role="tab"][aria-selected="true"]')).toContainText('AI Assist');
    
    // Check that AI Assist panel has loaded
    await expect(page.locator('text=Entities')).toBeVisible();
    await expect(page.locator('text=Summary')).toBeVisible();
    await expect(page.locator('text=File Q&A')).toBeVisible();
  });
});

// Helper functions

async function setupTestEnvironment(page) {
  // Check if there's already a project
  const projectListItem = page.locator('[data-test="project-item"]').first();
  if (await projectListItem.isVisible()) {
    await projectListItem.click();
  } else {
    // Create a new project
    await page.locator('[data-test="create-project-button"]').click();
    await page.locator('input[placeholder="Project Name"]').fill('Test Project');
    await page.locator('button', { hasText: 'Create' }).click();
    
    // Wait for project to be created
    await page.waitForSelector('[data-test="project-item"]');
    await page.locator('[data-test="project-item"]').first().click();
  }
}

async function selectFileByType(page, fileType) {
  // Try to find an existing file of the specified type
  const fileItems = page.locator('[data-test="file-item"]');
  const count = await fileItems.count();
  
  let foundMatch = false;
  
  for (let i = 0; i < count; i++) {
    const item = fileItems.nth(i);
    const fileTypeText = await item.textContent();
    
    if (fileTypeText.toLowerCase().includes(fileType)) {
      await item.click();
      foundMatch = true;
      break;
    }
  }
  
  // If no file of the specified type exists, upload one
  if (!foundMatch) {
    // This would require having test files available and handling file uploads
    // For this test we'll just select any file
    await selectAnyFile(page);
  }
}

async function selectAnyFile(page) {
  const fileItem = page.locator('[data-test="file-item"]').first();
  if (await fileItem.isVisible()) {
    await fileItem.click();
  } else {
    // No files available, would need to upload one
    console.log('No files available to select');
  }
}

async function getZoomLevel(page) {
  // This function tries to get the current zoom level from the UI
  const zoomText = await page.locator('text=/[0-9]+%/').textContent();
  if (zoomText) {
    return parseInt(zoomText.replace('%', ''));
  }
  return 100; // Default zoom level
} 
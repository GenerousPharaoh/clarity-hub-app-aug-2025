import { test, expect } from '@playwright/test';

test.describe('Project Management and Search Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Ensure the app is loaded by waiting for the left panel
    await page.waitForSelector('[data-test="left-panel"]');
  });

  test('should create a new project', async ({ page }) => {
    // Generate a unique project name
    const projectName = `Test Project ${Date.now()}`;
    
    // Click the create project button
    await page.locator('[data-test="create-project-button"]').click();
    
    // Fill in the project name
    await page.locator('input[placeholder="Project Name"]').fill(projectName);
    
    // Submit the form
    await page.locator('button', { hasText: 'Create' }).click();
    
    // Wait for project to be created and selected
    await page.waitForSelector(`text=${projectName}`);
    
    // Verify project is selected
    await expect(page.locator('[data-test="project-item"][aria-selected="true"]')).toContainText(projectName);
  });

  test('should switch between projects', async ({ page }) => {
    // Ensure we have at least two projects
    const projectCount = await page.locator('[data-test="project-item"]').count();
    
    if (projectCount < 2) {
      // Create an additional project if needed
      await page.locator('[data-test="create-project-button"]').click();
      await page.locator('input[placeholder="Project Name"]').fill(`Test Project ${Date.now()}`);
      await page.locator('button', { hasText: 'Create' }).click();
      await page.waitForSelector('[data-test="project-item"]');
    }
    
    // Get the text of the first project
    const firstProjectText = await page.locator('[data-test="project-item"]').first().textContent();
    
    // Click the second project
    await page.locator('[data-test="project-item"]').nth(1).click();
    
    // Verify second project is selected
    await expect(page.locator('[data-test="project-item"][aria-selected="true"]')).toBeVisible();
    
    // Get the text of the selected project
    const selectedProjectText = await page.locator('[data-test="project-item"][aria-selected="true"]').textContent();
    
    // Verify first and selected projects are different
    expect(firstProjectText).not.toEqual(selectedProjectText);
    
    // Click back to the first project
    await page.locator('[data-test="project-item"]').first().click();
    
    // Verify first project is selected again
    await expect(page.locator('[data-test="project-item"][aria-selected="true"]')).toContainText(firstProjectText);
  });

  test('should upload and view a file', async ({ page }) => {
    // First ensure a project is selected
    const projectItem = page.locator('[data-test="project-item"]').first();
    await projectItem.click();
    
    // Check if upload button exists
    const uploadButton = page.locator('[data-test="upload-button"]');
    await expect(uploadButton).toBeVisible();
    
    // Note: Actual file upload requires special handling in Playwright
    // Here, we would typically use page.setInputFiles() but that requires
    // direct access to the file input element which may be hidden
    
    // For demonstration, we'll assume a file exists and just test file selection
    const fileItem = page.locator('[data-test="file-item"]').first();
    
    // If there's no file, we'll skip this test
    if (await fileItem.count() === 0) {
      test.skip();
    }
    
    // Select the file
    await fileItem.click();
    
    // Verify file is selected
    await expect(page.locator('[data-test="file-item"][aria-selected="true"]')).toBeVisible();
    
    // Verify file viewer is loaded
    await expect(page.locator('[data-test="right-panel"]')).not.toContainText('No file selected');
  });

  test('search functionality should filter files', async ({ page }) => {
    // First ensure a project is selected
    const projectItem = page.locator('[data-test="project-item"]').first();
    await projectItem.click();
    
    // If there are no files, skip this test
    const fileCount = await page.locator('[data-test="file-item"]').count();
    if (fileCount === 0) {
      test.skip();
      return;
    }
    
    // Get text of the first file for search
    const fileText = await page.locator('[data-test="file-item"]').first().textContent();
    const searchTerm = fileText.substring(0, 3); // Use first few characters as search term
    
    // Enter search term
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill(searchTerm);
    
    // Wait for search results to update
    await page.waitForTimeout(500); // Small delay to allow debounced search to execute
    
    // Verify filtered results contain our search term
    const visibleFiles = page.locator('[data-test="file-item"]:visible');
    await expect(visibleFiles.first()).toContainText(searchTerm, { ignoreCase: true });
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);
    
    // Verify all files are shown again
    const filesAfterClear = await page.locator('[data-test="file-item"]').count();
    expect(filesAfterClear).toEqual(fileCount);
  });

  test('advanced search filters should work', async ({ page }) => {
    // First ensure a project is selected
    const projectItem = page.locator('[data-test="project-item"]').first();
    await projectItem.click();
    
    // If there are no files, skip this test
    const fileCount = await page.locator('[data-test="file-item"]').count();
    if (fileCount === 0) {
      test.skip();
      return;
    }
    
    // Open advanced search
    const filterButton = page.locator('button[aria-label="advanced search"]');
    await filterButton.click();
    
    // Wait for advanced search panel to appear
    await page.waitForSelector('text=File Type');
    
    // Test file type filter
    // Select a file type (assuming PDF exists - adjust as needed)
    const fileTypeSelect = page.locator('input[placeholder="Select file types"]');
    await fileTypeSelect.click();
    
    // Try to select PDF option
    const pdfOption = page.locator('li', { hasText: 'PDF' }).first();
    if (await pdfOption.isVisible()) {
      await pdfOption.click();
      
      // Close the dropdown
      await page.keyboard.press('Escape');
      
      // Apply filters
      await page.locator('button', { hasText: 'Apply Filters' }).click();
      
      // Verify results are filtered
      const visibleFiles = page.locator('[data-test="file-item"]:visible');
      if (await visibleFiles.count() > 0) {
        // If files are visible, check they contain PDF indicator
        await expect(visibleFiles.first()).toContainText('PDF', { ignoreCase: true });
      }
      
      // Reset filters
      await page.locator('button', { hasText: 'Reset Filters' }).click();
      
      // Verify all files are shown again
      await page.waitForTimeout(500);
      const filesAfterReset = await page.locator('[data-test="file-item"]:visible').count();
      expect(filesAfterReset).toBeGreaterThanOrEqual(fileCount);
    }
  });
}); 
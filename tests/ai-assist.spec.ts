import { test, expect } from '@playwright/test';

test.describe('AI Assist Panel Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Ensure the app is loaded by waiting for the left panel
    await page.waitForSelector('[data-test="left-panel"]');
    
    // Create a test project if needed and select a file
    await setupTestEnvironment(page);
    
    // Switch to AI Assist tab
    await page.locator('button[role="tab"]').nth(1).click();
    await expect(page.locator('button[role="tab"][aria-selected="true"]')).toContainText('AI Assist');
  });

  test('Entities tab should display entity extraction UI', async ({ page }) => {
    // Verify we're on the Entities tab by default
    await expect(page.locator('button[role="tab"][aria-selected="true"]')).toContainText('Entities');
    
    // Check for entity extraction UI elements
    await expect(page.locator('text=Extracted Entities')).toBeVisible();
    
    // Check if entities are loaded or "Extract Entities" button is present
    const hasEntities = await page.locator('div.MuiChip-root').count() > 0;
    const hasExtractButton = await page.locator('button:has-text("Extract Entities")').isVisible();
    
    // Either entities should be loaded or extract button should be available
    expect(hasEntities || hasExtractButton).toBeTruthy();
    
    // If extract button is present, click it and verify extraction starts
    if (hasExtractButton) {
      await page.locator('button:has-text("Extract Entities")').click();
      await expect(page.locator('text=Extracting entities')).toBeVisible();
      
      // Wait for extraction to complete (up to 30 seconds)
      await page.waitForSelector('div.MuiChip-root', { timeout: 30000 });
    }
  });

  test('Summary tab should display file summary or generate button', async ({ page }) => {
    // Switch to Summary tab
    await page.locator('button[role="tab"]').filter({ hasText: 'Summary' }).click();
    
    // Check that we're on Summary tab
    await expect(page.locator('button[role="tab"][aria-selected="true"]')).toContainText('Summary');
    
    // Check if summary is loaded or "Generate Summary" button is present
    const hasSummaryText = await page.locator('text=/^(?!.*(No summary available|Generate Summary)).*$/').isVisible();
    const hasGenerateButton = await page.locator('button:has-text("Generate Summary")').isVisible();
    
    // Either summary should be loaded or generate button should be available
    expect(hasSummaryText || hasGenerateButton).toBeTruthy();
    
    // If generate button is present, click it and verify summary generation starts
    if (hasGenerateButton) {
      await page.locator('button:has-text("Generate Summary")').click();
      await expect(page.locator('text=Generating summary')).toBeVisible();
      
      // Wait for summary generation to complete (up to 30 seconds)
      // This is a longer running AI task, so we need a longer timeout
      await page.waitForSelector('text=/^(?!.*(No summary available|Generate Summary)).*$/', { timeout: 30000 });
    }
  });

  test('File Q&A should allow asking questions about the file', async ({ page }) => {
    // Switch to File Q&A tab
    await page.locator('button[role="tab"]').filter({ hasText: 'File Q&A' }).click();
    
    // Check that we're on File Q&A tab
    await expect(page.locator('button[role="tab"][aria-selected="true"]')).toContainText('File Q&A');
    
    // Check for question input field and submit button
    const questionInput = page.locator('textarea[placeholder*="question"]');
    await expect(questionInput).toBeVisible();
    
    const askButton = page.locator('button:has-text("Ask Question")');
    await expect(askButton).toBeVisible();
    
    // Enter a test question
    await questionInput.fill('What is this document about?');
    
    // Click ask button
    await askButton.click();
    
    // Verify that analysis is in progress
    await expect(page.locator('text=Analyzing')).toBeVisible();
    
    // Wait for answer (up to 30 seconds for AI response)
    // This is a longer running AI task, so we need a longer timeout
    await page.waitForSelector('div.MuiPaper-root p:not(:has-text("Analyzing"))');
  });

  test('Project Q&A should allow asking questions about the project', async ({ page }) => {
    // Switch to Project Q&A tab
    await page.locator('button[role="tab"]').filter({ hasText: 'Project Q&A' }).click();
    
    // Check that we're on Project Q&A tab
    await expect(page.locator('button[role="tab"][aria-selected="true"]')).toContainText('Project Q&A');
    
    // Check for question input field and submit button
    const questionInput = page.locator('textarea[placeholder*="question"]');
    await expect(questionInput).toBeVisible();
    
    const askButton = page.locator('button:has-text("Ask Question")');
    await expect(askButton).toBeVisible();
    
    // Enter a test question
    await questionInput.fill('What are the main topics in this project?');
    
    // Click ask button
    await askButton.click();
    
    // Verify that analysis is in progress
    await expect(page.locator('text=Analyzing')).toBeVisible();
    
    // Wait for answer (up to 45 seconds for AI response - this is a complex operation)
    // This is a longer running AI task across multiple documents, so we need a longer timeout
    await page.waitForSelector('div.MuiPaper-root p:not(:has-text("Analyzing"))');
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
  
  // Select any file
  const fileItem = page.locator('[data-test="file-item"]').first();
  if (await fileItem.isVisible()) {
    await fileItem.click();
  } else {
    // No files available, we'd need to upload one
    console.log('No files available to select');
    
    // Here we could implement file upload if we have test files available
    // For now we'll just fail the test if no files are available
    expect(await fileItem.count()).toBeGreaterThan(0, 'No files available for testing');
  }
} 
import { test, expect } from '@playwright/test';

test.describe('Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Ensure the app is loaded by waiting for the left panel
    await page.waitForSelector('[data-test="left-panel"]');
  });

  test('panels should render correctly', async ({ page }) => {
    // Verify all three panels are present
    await expect(page.locator('body')).toContainText('Clarity Hub');
    
    // Check left panel
    const leftPanel = page.locator('[data-test="left-panel"]');
    await expect(leftPanel).toBeVisible();
    
    // Check center panel
    const centerPanel = page.locator('text=Welcome to Clarity Hub');
    await expect(centerPanel).toBeVisible();
    
    // Check that initial panel sizes are applied
    const leftPanelWidth = await leftPanel.evaluate((el) => el.getBoundingClientRect().width);
    expect(leftPanelWidth).toBeGreaterThan(250); // Should be at least the min width
  });

  test('panels should be collapsible', async ({ page }) => {
    // Get the initial left panel width
    const leftPanel = page.locator('[data-test="left-panel"]');
    const initialLeftWidth = await leftPanel.evaluate((el) => el.getBoundingClientRect().width);
    
    // Find and click the left panel collapse button
    const leftCollapseButton = page.locator('button', { hasText: 'ChevronLeft' });
    await leftCollapseButton.click();
    
    // Wait for animation to complete
    await page.waitForTimeout(300);
    
    // Check that left panel is now collapsed (zero width)
    const collapsedLeftWidth = await leftPanel.evaluate((el) => el.getBoundingClientRect().width);
    expect(collapsedLeftWidth).toBeLessThan(initialLeftWidth);
    
    // Now expand it again
    const expandLeftButton = page.locator('button', { hasText: 'MenuOpen' });
    await expandLeftButton.click();
    
    // Wait for animation to complete
    await page.waitForTimeout(300);
    
    // Verify panel is expanded again
    const expandedLeftWidth = await leftPanel.evaluate((el) => el.getBoundingClientRect().width);
    expect(expandedLeftWidth).toBeGreaterThan(collapsedLeftWidth);
  });

  test('panels should be resizable', async ({ page }) => {
    // Find the left panel resize handle
    const leftResizeHandle = page.locator('div.resize-handle').first();
    
    // Get initial panel widths
    const leftPanel = page.locator('[data-test="left-panel"]');
    const initialLeftWidth = await leftPanel.evaluate((el) => el.getBoundingClientRect().width);
    
    // Resize the left panel
    const box = await leftResizeHandle.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + box.height / 2); // Move 100px to the right
      await page.mouse.up();
    }
    
    // Get the new width
    const newLeftWidth = await leftPanel.evaluate((el) => el.getBoundingClientRect().width);
    
    // Check that width changed
    expect(newLeftWidth).not.toEqual(initialLeftWidth);
  });
  
  test('panel sizes should persist after reload', async ({ page }) => {
    // Find the left panel resize handle
    const leftResizeHandle = page.locator('div.resize-handle').first();
    
    // Resize the left panel
    const box = await leftResizeHandle.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + box.height / 2); // Move 100px to the right
      await page.mouse.up();
    }
    
    // Store the width after resize
    const leftPanel = page.locator('[data-test="left-panel"]');
    const widthAfterResize = await leftPanel.evaluate((el) => el.getBoundingClientRect().width);
    
    // Reload the page
    await page.reload();
    
    // Wait for the page to load
    await page.waitForSelector('[data-test="left-panel"]');
    
    // Get the width after reload
    const widthAfterReload = await leftPanel.evaluate((el) => el.getBoundingClientRect().width);
    
    // Check that the width was preserved (approximately)
    expect(Math.abs(widthAfterReload - widthAfterResize)).toBeLessThan(10); // Allow small differences due to rounding/rendering
  });
}); 
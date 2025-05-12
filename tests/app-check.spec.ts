import { test, expect, Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Test user credentials
const USER_EMAIL = 'kareem.hassanein@gmail.com';
const USER_PASSWORD = 'Kingtut11-';

test.describe('Basic App Functionality Tests', () => {
  // Login helper function
  async function login(page: Page): Promise<void> {
    // Go to the base URL first to see the login screen
    await page.goto('/');
    
    // Wait for the page to load with a longer timeout
    await page.waitForTimeout(2000);
    
    // Check if already logged in by looking for dashboard elements
    const isLoggedIn = await page.getByTestId('right-panel').isVisible().catch(() => false);
    if (isLoggedIn) {
      console.log('Already logged in, skipping login process');
      return;
    }

    console.log('Looking for login form elements...');
    
    // Try several selectors for email and password fields
    const emailField = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"], input#email');
    const passwordField = page.locator('input[type="password"], input[placeholder*="password"], input[name="password"], input#password');
    
    // Wait longer for login fields to appear
    try {
      await emailField.waitFor({ timeout: 15000 });
      console.log('Email field found');
    } catch (e) {
      console.log('Email field not found, printing page content for debugging');
      console.log(await page.content());
      throw e;
    }
    
    // Fill in credentials
    await emailField.fill(USER_EMAIL);
    await passwordField.fill(USER_PASSWORD);
    
    // Click login button - try multiple selectors
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign in"), button[type="submit"]');
    await loginButton.click();
    
    // Wait for navigation to complete
    await page.waitForURL('/**/projects', { timeout: 15000 });
    console.log('Login successful');
  }

  test('basic login and navigation works', async ({ page }) => {
    await login(page);
    
    // Verify we're on the projects page
    await expect(page.getByText('Projects')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('right-panel')).toBeVisible();
  });

  test('file selection and viewing works', async ({ page }) => {
    await login(page);
    
    // Wait for projects to load
    await page.waitForTimeout(2000);
    
    // Click on the first project
    const projectItem = page.locator('.MuiListItem-root').first();
    await projectItem.click();
    
    // Wait for files to load
    await page.waitForTimeout(2000);
    
    // Click on the first file
    const fileItem = page.locator('.MuiListItem-root').nth(1);
    await fileItem.click();
    
    // Wait for file viewer to load
    await page.waitForTimeout(2000);
    
    // Verify the right panel shows a file viewer
    const rightPanel = page.getByTestId('right-panel');
    await expect(rightPanel).toBeVisible();
    
    // Check that the file viewer is present
    const fileViewer = page.locator('[data-testid="file-viewer"]');
    await expect(fileViewer).toBeVisible({ timeout: 15000 });
  });

  test('navigation between screens works', async ({ page }) => {
    await login(page);
    
    // Click on settings
    const settingsLink = page.getByText('Settings', { exact: true });
    await settingsLink.click();
    
    // Verify we're on settings page
    await expect(page.getByText('Account Settings')).toBeVisible({ timeout: 10000 });
    
    // Go back to projects
    const projectsLink = page.getByText('Projects', { exact: true });
    await projectsLink.click();
    
    // Verify we're back on projects page
    await expect(page.getByText('Projects')).toBeVisible({ timeout: 10000 });
  });
}); 
import { test, expect } from '@playwright/test';
import path from 'path';
import os from 'os';

// Test user credentials
const USER_EMAIL = 'kareem.hassanein@gmail.com';
const USER_PASSWORD = 'your-password'; // Update this with the actual password

// Get the full path to the test files
const TEST_FILES = [
  path.resolve(os.homedir(), 'Desktop/test-files/13-A: 3-Year Revenue Analysis Establishing Growth and Financial Vitality (Aug-11-2024).pdf'),
  path.resolve(os.homedir(), 'Desktop/test-files/6-D: May Agreement Document Explicitly Defines Monday–Friday Schedule (May-10-2024).jpeg'),
  path.resolve(os.homedir(), 'Desktop/test-files/6-F: Employer Confirms Saturday Start Date During Aug 21 Agreement ("So Saturdays starting... 7th?") (Aug-21-2024).mp3'),
];

test.describe('File Upload Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app's login page
    await page.goto('http://localhost:5173');
    
    // Check if we're already logged in by looking for a logout button
    const isLoggedIn = await page.getByRole('button', { name: /logout|sign out/i }).isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      console.log('Not logged in, performing login...');
      
      // Wait for login form to be visible
      await page.waitForSelector('input[type="email"], [data-test="auth-form"]');
      
      // Fill in login credentials
      await page.locator('input[type="email"]').fill(USER_EMAIL);
      await page.locator('input[type="password"]').fill(USER_PASSWORD);
      
      // Click the sign-in button
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      // Wait for navigation to complete after login
      await page.waitForURL('**/projects');
    } else {
      console.log('Already logged in, proceeding with tests...');
    }
  });

  test('should create a project and upload various file types', async ({ page }) => {
    // Navigate to projects page if needed
    if (!page.url().includes('/projects')) {
      await page.goto('http://localhost:5173/projects');
    }
    
    // Click "Create New Project" button
    await page.getByRole('button', { name: /create|new|add/i }).first().click();
    
    // Fill out project creation form
    const projectName = `Test Project ${new Date().toISOString().slice(0, 10)}`;
    await page.locator('input[name="name"], input[placeholder="Project Name"]').fill(projectName);
    
    // If there's a goal type field, select it
    const goalTypeSelect = await page.locator('select[name="goalType"]').isVisible();
    if (goalTypeSelect) {
      await page.locator('select[name="goalType"]').selectOption('legal-case');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /create|submit|save/i }).click();
    
    // Wait for the project to be created and redirected to project view
    await page.waitForURL('**/project/**');
    
    // Verify we're in the project dashboard
    await expect(page.getByText(projectName)).toBeVisible();
    
    console.log('Project created successfully, proceeding to file upload...');
    
    // Click on upload or add files button
    await page.getByRole('button', { name: /upload|add files/i }).click();
    
    // Check for file upload dialog
    await expect(page.getByText(/drag & drop files|upload files/i)).toBeVisible();
    
    // Upload each test file (one by one)
    for (const filePath of TEST_FILES) {
      console.log(`Uploading file: ${filePath}`);
      
      // Find the file input
      const fileInput = page.locator('input[type="file"]');
      
      // Set the filepath for upload
      await fileInput.setInputFiles(filePath);
      
      // Wait for upload to complete (this could take some time)
      await page.waitForSelector('text=/100%|completed|success/i', { timeout: 30000 });
      
      console.log('File uploaded successfully');
    }
    
    // Close the upload dialog
    await page.getByRole('button', { name: /close|done/i }).click();
    
    // Verify files appear in the left panel
    for (const filePath of TEST_FILES) {
      const fileName = path.basename(filePath).split(':').pop()?.trim();
      console.log(`Looking for file in list: ${fileName}`);
      // Wait for file to appear in the list
      await page.waitForSelector(`text="${fileName}"`, { timeout: 10000 });
    }
    
    // Test viewing a file
    const firstFileName = path.basename(TEST_FILES[0]).split(':').pop()?.trim();
    await page.locator(`text="${firstFileName}"`).first().click();
    
    // Verify file viewer is visible
    await page.waitForSelector('[data-test="file-viewer"]', { timeout: 10000 });
    
    console.log('File viewing successful');
  });
}); 
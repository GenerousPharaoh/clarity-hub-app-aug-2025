import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Test user credentials - using provided credentials
const USER_EMAIL = 'kareem.hassanein@gmail.com';
const USER_PASSWORD = 'Kingtut11-';

// Test files to upload
const TEST_FILES = {
  PDF: path.join(__dirname, 'fixtures', 'test-document.pdf'),
  IMAGE: path.join(__dirname, 'fixtures', 'test-image.jpg'),
  DOCUMENT: path.join(__dirname, 'fixtures', 'test-document.docx'),
};

// Create test fixtures directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'fixtures'))) {
  fs.mkdirSync(path.join(__dirname, 'fixtures'));
}

// Create simple test files if they don't exist
const createTestFiles = () => {
  // Create a simple text file for the PDF
  if (!fs.existsSync(TEST_FILES.PDF)) {
    // Use a small existing PDF file from the public folder if available
    const publicPdfPath = path.join(__dirname, '..', 'public', 'pdf', 'test.pdf');
    if (fs.existsSync(publicPdfPath)) {
      fs.copyFileSync(publicPdfPath, TEST_FILES.PDF);
    } else {
      // Create a placeholder file
      fs.writeFileSync(TEST_FILES.PDF, 'Test PDF content');
    }
  }

  // Create a simple image file
  if (!fs.existsSync(TEST_FILES.IMAGE)) {
    // Use a small existing image file if available
    const publicImagePath = path.join(__dirname, '..', 'public', 'placeholder.png');
    if (fs.existsSync(publicImagePath)) {
      fs.copyFileSync(publicImagePath, TEST_FILES.IMAGE);
    } else {
      // Create a placeholder file
      fs.writeFileSync(TEST_FILES.IMAGE, 'Test image content');
    }
  }

  // Create a simple document file
  if (!fs.existsSync(TEST_FILES.DOCUMENT)) {
    fs.writeFileSync(TEST_FILES.DOCUMENT, 'Test document content');
  }
};

// Helper to log in or enter demo mode
async function loginOrEnterDemoMode(page: Page) {
  await page.goto('/'); // Go to root, login/demo should be presented here

  // Try to click demo mode button first
  const demoButton = page.locator('button:has-text("Skip Login (Demo Mode)"), button:has-text("Demo Mode")');
  if (await demoButton.count() > 0 && await demoButton.isVisible()) {
    console.log('Attempting to enter Demo Mode...');
    await demoButton.click();
    // Wait for navigation to projects or dashboard after demo mode
    await page.waitForURL(/.*\/projects|.*\/dashboard/, { timeout: 10000 });
    console.log('Entered Demo Mode successfully.');
    return;
  }

  // If demo mode button not found or not visible, proceed to login page
  console.log('Demo Mode button not found or not visible, proceeding to login page...');
  await page.goto('/login');
  
  // Check for login form elements instead of just page title
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('input[type="password"]')).toBeVisible();
  console.log('Login page loaded.');

  await page.fill('input[type="email"]', USER_EMAIL);
  await page.fill('input[type="password"]', USER_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for login to complete
  await page.waitForURL(/.*\/projects|.*\/dashboard/, { timeout: 10000 });
  console.log('Login successful.');
}

// Helper to create a test project
async function createTestProject(page: Page) {
  // Click on create project button
  await page.click('button:has-text("New Project"), button:has-text("Create Project")');
  
  // Fill out project form
  await page.fill('input[name="name"], input[placeholder="Project Name"]', 'Test Upload Project');
  await page.click('button[type="submit"], button:has-text("Create")');
  
  // Wait for project creation and navigation
  await page.waitForNavigation({ timeout: 15000 });
  
  // Get the project URL or ID
  const url = page.url();
  const projectId = url.split('/').pop();
  
  return projectId;
}

// Test file upload feature
test.describe('File Upload Feature Tests', () => {
  test.beforeAll(() => {
    // Create test files
    createTestFiles();
  });
  
  test.beforeEach(async ({ page }) => {
    // Log in or enter demo mode before each test
    await loginOrEnterDemoMode(page);
  });
  
  test('should upload a PDF file successfully', async ({ page }) => {
    // Create or navigate to a project
    const projectId = await createTestProject(page);
    
    // Navigate to the project page
    await page.goto(`/project/${projectId}`);
    
    // Click on upload button - using multiple selectors for resilience
    await page.click('button:has-text("Upload"), [data-test="upload-button"]');
    
    // Upload the PDF file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=browse files, [data-test="drop-zone"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(TEST_FILES.PDF);
    
    // Wait for upload to complete
    await page.waitForSelector('text=File uploaded successfully, text=completed', { timeout: 30000 });
    
    // Verify file appears in the list
    const fileName = path.basename(TEST_FILES.PDF);
    await expect(page.locator(`text=${fileName}`)).toBeVisible();
    
    // Select the file to view it
    await page.click(`text=${fileName}`);
    
    // Verify file viewer appears
    await expect(page.locator('[data-test="file-viewer"], [data-test="pdf-viewer"]')).toBeVisible({ timeout: 15000 });
  });
  
  test('should upload an image file successfully', async ({ page }) => {
    // Navigate to the projects page
    await page.goto('/projects');
    
    // Find and click on the first project (assuming one exists)
    await page.click('.project-item, [data-test="project-item"]');
    
    // Click on upload button
    await page.click('button:has-text("Upload"), [data-test="upload-button"]');
    
    // Upload the image file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=browse files, [data-test="drop-zone"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(TEST_FILES.IMAGE);
    
    // Wait for upload to complete
    await page.waitForSelector('text=File uploaded successfully, text=completed', { timeout: 30000 });
    
    // Verify file appears in the list
    const fileName = path.basename(TEST_FILES.IMAGE);
    await expect(page.locator(`text=${fileName}`)).toBeVisible();
    
    // Select the file to view it
    await page.click(`text=${fileName}`);
    
    // Verify image viewer appears
    await expect(page.locator('[data-test="file-viewer"], [data-test="image-viewer"]')).toBeVisible({ timeout: 15000 });
  });
  
  test('should show error for unsupported file type', async ({ page }) => {
    // This test is optional and depends on your app's requirements
    // If all file types are supported, modify or skip this test
    
    // Navigate to the projects page
    await page.goto('/projects');
    
    // Find and click on the first project (assuming one exists)
    await page.click('.project-item, [data-test="project-item"]');
    
    // Click on upload button
    await page.click('button:has-text("Upload"), [data-test="upload-button"]');
    
    // Create an unsupported file type (if your app has any)
    const unsupportedFile = path.join(__dirname, 'fixtures', 'test-unsupported.xyz');
    fs.writeFileSync(unsupportedFile, 'Unsupported file type');
    
    // Upload the unsupported file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=browse files, [data-test="drop-zone"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(unsupportedFile);
    
    // Check for error message (if your app has file type restrictions)
    await page.waitForSelector('text=error, text=failed', { timeout: 30000 });
    
    // Clean up
    fs.unlinkSync(unsupportedFile);
  });
  
  test('multiple file upload should work', async ({ page }) => {
    // Navigate to the projects page
    await page.goto('/projects');
    
    // Find and click on the first project (assuming one exists)
    await page.click('.project-item, [data-test="project-item"]');
    
    // Click on upload button
    await page.click('button:has-text("Upload"), [data-test="upload-button"]');
    
    // Upload multiple files
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=browse files, [data-test="drop-zone"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([TEST_FILES.PDF, TEST_FILES.IMAGE]);
    
    // Wait for uploads to complete
    await page.waitForSelector('text=File uploaded successfully, text=completed', { timeout: 60000 });
    
    // Verify both files appear in the list
    const pdfName = path.basename(TEST_FILES.PDF);
    const imageName = path.basename(TEST_FILES.IMAGE);
    
    await expect(page.locator(`text=${pdfName}`)).toBeVisible();
    await expect(page.locator(`text=${imageName}`)).toBeVisible();
  });
}); 
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const APP_URL = 'http://localhost:5173';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-files', 'test-image.jpg');
const TEST_PDF_PATH = path.join(__dirname, 'test-files', 'test-document.pdf');
const TEST_PROJECT_NAME = 'Test Project ' + Date.now();

// Create test directory and files if they don't exist
function setupTestFiles() {
  const testDir = path.join(__dirname, 'test-files');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  // Create a simple test image if it doesn't exist
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    // This is a minimal valid JPEG file
    const minimalJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 
      0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 
      0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 
      0x00, 0xFF, 0xD9
    ]);
    fs.writeFileSync(TEST_IMAGE_PATH, minimalJpeg);
  }
  
  // Create a simple PDF if it doesn't exist
  if (!fs.existsSync(TEST_PDF_PATH)) {
    // Minimal valid PDF content
    const minimalPdf = '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF';
    fs.writeFileSync(TEST_PDF_PATH, minimalPdf);
  }
}

async function runTest() {
  console.log('Setting up test files...');
  setupTestFiles();
  
  console.log('Starting browser test...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Login if needed (this depends on your auth setup)
    if (await page.locator('text=Login').isVisible()) {
      console.log('Logging in...');
      // Click login button (adjust selector as needed)
      await page.click('text=Login');
      // Fill credentials (adjust as needed)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForLoadState('networkidle');
    }
    
    // Create a new project
    console.log('Creating new project...');
    await page.click('[data-test="new-project-button"]');
    await page.fill('[data-test="project-name-input"]', TEST_PROJECT_NAME);
    await page.click('[data-test="create-project-button"]');
    // Wait for project creation
    await page.waitForLoadState('networkidle');
    console.log('Project created.');
    
    // Upload a file
    console.log('Uploading test image...');
    // Click upload button and handle file chooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('[data-test="upload-button"]')
    ]);
    
    await fileChooser.setFiles(TEST_IMAGE_PATH);
    
    // Wait for upload to complete
    await page.waitForSelector('text=File uploaded successfully', { timeout: 30000 });
    console.log('Image uploaded successfully.');
    
    // Upload a PDF
    console.log('Uploading test PDF...');
    const [pdfChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('[data-test="upload-button"]')
    ]);
    
    await pdfChooser.setFiles(TEST_PDF_PATH);
    
    // Wait for upload to complete
    await page.waitForSelector('text=File uploaded successfully', { timeout: 30000 });
    console.log('PDF uploaded successfully.');
    
    // Verify files appear in the list
    console.log('Verifying files in list...');
    await page.waitForSelector('[data-test="file-item"]');
    const fileCount = await page.locator('[data-test="file-item"]').count();
    console.log(`Found ${fileCount} files in the list.`);
    
    // Click on files to view
    console.log('Testing file viewing...');
    const fileItems = page.locator('[data-test="file-item"]');
    
    // Click on the first file
    await fileItems.first().click();
    // Wait for the viewer to load
    await page.waitForLoadState('networkidle');
    console.log('First file viewed successfully.');
    
    // Click on the second file if it exists
    if (fileCount > 1) {
      await fileItems.nth(1).click();
      await page.waitForLoadState('networkidle');
      console.log('Second file viewed successfully.');
    }
    
    // Refresh the page to test persistence
    console.log('Testing persistence by refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if files are still there
    await page.waitForSelector('[data-test="file-item"]');
    const fileCountAfterRefresh = await page.locator('[data-test="file-item"]').count();
    console.log(`Found ${fileCountAfterRefresh} files after refresh.`);
    
    if (fileCountAfterRefresh === fileCount) {
      console.log('✅ Files persisted successfully after refresh.');
    } else {
      console.log('❌ File count changed after refresh.');
    }
    
    console.log('Test completed successfully.');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

runTest().catch(console.error); 
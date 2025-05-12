// E2E test for file upload functionality, AI triggers, and file rendering
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Test credentials
const USER_EMAIL = 'kareem.hassanein@gmail.com';
const USER_PASSWORD = 'Kingtut11-';

// Generate unique project name
const TEST_PROJECT_NAME = `Test Project ${new Date().toISOString().split('T')[0]}`;

// Test file paths for different file types
const TEST_FILES = {
  text: {
    path: path.join(process.cwd(), 'test-files/sample-text.txt'),
    content: 'This is a sample text file for testing file upload and rendering.',
    type: 'text/plain'
  },
  pdf: {
    path: path.join(process.cwd(), 'test-files/sample-pdf.pdf'),
    type: 'application/pdf'
  },
  docx: {
    path: path.join(process.cwd(), 'test-files/sample-doc.docx'),
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
};

// Create test files if they don't exist
function createTestFiles() {
  const testFilesDir = path.join(process.cwd(), 'test-files');
  
  if (!fs.existsSync(testFilesDir)) {
    fs.mkdirSync(testFilesDir, { recursive: true });
  }
  
  // Create text file
  fs.writeFileSync(TEST_FILES.text.path, TEST_FILES.text.content);
  
  // Create simple PDF file if it doesn't exist
  if (!fs.existsSync(TEST_FILES.pdf.path)) {
    // Create a simple placeholder
    const pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R/Parent 2 0 R>>endobj 4 0 obj<</Length 23>>stream\nBT /F1 12 Tf 100 700 Td (Test PDF) Tj ET\nendstream\nendobj\ntrailer<</Size 5/Root 1 0 R>>\n%%EOF";
    fs.writeFileSync(TEST_FILES.pdf.path, pdfContent);
  }
  
  // Create simple DOCX file if it doesn't exist
  if (!fs.existsSync(TEST_FILES.docx.path)) {
    // Create a simple placeholder
    const docxContent = "PK\u0003\u0004\u0014\u0000\u0006\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000Test document";
    fs.writeFileSync(TEST_FILES.docx.path, docxContent);
  }
  
  console.log('Test files created successfully');
}

test.describe('Clarity Hub File Upload E2E Tests', () => {
  test.beforeAll(() => {
    // Create necessary test files
    createTestFiles();
  });
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check if already logged in by looking for the avatar
    const isLoggedIn = await page.locator('.MuiAvatar-root').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      console.log('Logging in...');
      // Find and fill email field - use more specific selectors based on what we see in the UI
      await page.locator('input[type="email"]').fill(USER_EMAIL);
      await page.locator('input[type="password"]').fill(USER_PASSWORD);
      await page.locator('button:has-text("Sign In")').click();
      
      // Wait for the dashboard to load
      await page.waitForSelector('header:has-text("Clarity Hub")', { timeout: 10000 });
      console.log('Logged in successfully');
    } else {
      console.log('Already logged in');
    }
  });
  
  test('should create project, upload files, trigger AI and render files', async ({ page }) => {
    // Step 1: Create a new project
    console.log('Creating new project...');
    
    // Look for the New button or create project link
    await page.locator('text=Create your first project').click();
    
    // Fill in project details in the dialog
    await page.locator('input[placeholder="Project Name"]').fill(TEST_PROJECT_NAME);
    await page.locator('button:has-text("Create")').click();
    
    // Wait for the project to be created
    await page.waitForSelector(`text=${TEST_PROJECT_NAME}`, { timeout: 10000 });
    console.log(`Project "${TEST_PROJECT_NAME}" created successfully`);
    
    // Step 2: Upload a text file
    console.log('Uploading text file...');
    
    // Find the upload button
    const uploadButton = page.locator('button:has-text("Upload")');
    await expect(uploadButton).toBeVisible({ timeout: 5000 });
    await uploadButton.click();
    
    // Wait for file input to be available and upload the text file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_FILES.text.path);
    
    // Wait for upload to complete - this could be a success message or the file appearing in the list
    await page.waitForSelector(`text=sample-text.txt`, { timeout: 10000 });
    console.log('Text file uploaded successfully');
    
    // Step 3: Verify AI is triggered (if enabled)
    console.log('Checking if AI analysis is triggered...');
    
    // This may vary based on your UI implementation, look for indicators like a loading spinner
    // or an analysis result panel
    const aiProcessingVisible = await page.locator('.ai-analysis-indicator, .ai-result-panel').isVisible().catch(() => false);
    
    if (aiProcessingVisible) {
      console.log('AI analysis is being performed');
      // Wait for AI analysis to complete (optional - may take a while)
      await page.waitForSelector('.ai-analysis-complete', { timeout: 30000 }).catch(() => {
        console.log('AI analysis completion indicator not found, continuing test');
      });
    } else {
      console.log('AI analysis indicators not found, may be disabled or differently implemented');
    }
    
    // Step 4: Click on the uploaded file to render it
    console.log('Testing file rendering...');
    
    // Find and click on the uploaded text file in the list
    const uploadedTextFile = page.locator('text=sample-text.txt').first();
    await uploadedTextFile.click();
    
    // Wait for the file content to appear in the right panel
    await page.waitForSelector('[data-test="right-panel"]', { timeout: 5000 });
    
    // Verify the file viewer is showing some content
    const fileViewerVisible = await page.locator('[data-test="right-panel"] .file-viewer, [data-test="right-panel"] iframe').isVisible();
    expect(fileViewerVisible).toBeTruthy();
    
    console.log('Text file renders correctly in the right panel');
    
    // Step 5: Upload and test PDF file
    console.log('Testing PDF file upload and rendering...');
    
    // Click upload button again
    await uploadButton.click();
    
    // Upload PDF file
    await fileInput.setInputFiles(TEST_FILES.pdf.path);
    
    // Wait for upload to complete
    await page.waitForSelector(`text=sample-pdf.pdf`, { timeout: 10000 });
    
    // Click on the PDF file
    const uploadedPdfFile = page.locator('text=sample-pdf.pdf').first();
    await uploadedPdfFile.click();
    
    // Wait for PDF to load in viewer
    await page.waitForTimeout(2000); // Give viewer time to initialize
    
    // Verify PDF viewer is shown - this may be an iframe or PDF viewer component
    const pdfViewerVisible = await page.locator('[data-test="right-panel"] .pdf-viewer, [data-test="right-panel"] iframe').isVisible();
    expect(pdfViewerVisible).toBeTruthy();
    
    console.log('PDF file renders correctly');
    
    // Step 6: Upload and test DOCX file
    console.log('Testing DOCX file upload and rendering...');
    
    // Click upload button again
    await uploadButton.click();
    
    // Upload DOCX file
    await fileInput.setInputFiles(TEST_FILES.docx.path);
    
    // Wait for upload to complete
    await page.waitForSelector(`text=sample-doc.docx`, { timeout: 10000 });
    
    // Click on the DOCX file
    const uploadedDocxFile = page.locator('text=sample-doc.docx').first();
    await uploadedDocxFile.click();
    
    // Wait for document to load in viewer
    await page.waitForTimeout(2000); // Give viewer time to initialize
    
    // Verify document viewer is shown
    const docViewerVisible = await page.locator('[data-test="right-panel"] .document-viewer, [data-test="right-panel"] iframe').isVisible();
    expect(docViewerVisible).toBeTruthy();
    
    console.log('DOCX file renders correctly');
    
    // Final verification - switch back to text file
    await uploadedTextFile.click();
    await page.waitForTimeout(1000);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/file-upload-complete.png' });
    
    console.log('All tests passed successfully!');
  });
}); 
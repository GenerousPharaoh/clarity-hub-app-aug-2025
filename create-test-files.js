// Script to create test files for Clarity Hub testing
import fs from 'fs';
import path from 'path';

// Create test files directory if it doesn't exist
const testFilesDir = path.join(process.cwd(), 'test-files');
if (!fs.existsSync(testFilesDir)) {
  fs.mkdirSync(testFilesDir, { recursive: true });
}

// Create test results directory if it doesn't exist
const testResultsDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

// Create text file
const textContent = 'This is a sample text file for testing file upload and rendering.';
fs.writeFileSync(path.join(testFilesDir, 'sample-text.txt'), textContent);
console.log('Created sample-text.txt');

// Create simple PDF file
const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R/Parent 2 0 R>>endobj
4 0 obj<</Length 23>>stream
BT /F1 12 Tf 100 700 Td (Test PDF) Tj ET
endstream
endobj
trailer<</Size 5/Root 1 0 R>>
%%EOF`;
fs.writeFileSync(path.join(testFilesDir, 'sample-pdf.pdf'), pdfContent);
console.log('Created sample-pdf.pdf');

// Create simple DOCX file (just a minimal binary placeholder for testing)
const docxContent = 'PK\u0003\u0004\u0014\u0000\u0006\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000Test document';
fs.writeFileSync(path.join(testFilesDir, 'sample-doc.docx'), docxContent);
console.log('Created sample-doc.docx');

console.log('All test files created successfully'); 
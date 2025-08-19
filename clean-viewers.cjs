#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of obsolete files that can be safely removed
const obsoleteFiles = [
  'src/components/viewers/PDFViewer.tsx',
  'src/components/viewers/EnhancedPdfViewer.tsx',
  'src/components/viewers/ImageViewer.tsx',
  'src/components/viewers/EnhancedImageViewer.tsx',
  'src/components/viewers/AudioViewer.tsx',
  'src/components/viewers/VideoViewer.tsx',
  'src/components/viewers/AudioVideoViewer.tsx',
  'src/components/viewers/ViewerContainer.tsx',
  'src/components/viewers/TextViewer.tsx',
  'src/components/viewers/test-page.tsx',
  'src/components/viewers/UniversalFileViewer.tsx.bak',
  'src/components/viewers/direct-pdf-test.html',
  'src/components/UniversalFileViewer.tsx', // Duplicate in root components folder
];

// Files we'll keep (not removed)
const keepFiles = [
  'src/components/viewers/UniversalFileViewer.tsx', // We've updated this one
  'src/components/viewers/core/ViewerContainer.tsx',
  'src/components/viewers/core/PdfViewer.tsx',
  'src/components/viewers/core/ImageViewer.tsx',
  'src/components/viewers/core/MediaViewer.tsx',
  'src/components/viewers/core/TextViewer.tsx',
  'src/components/viewers/core/UnsupportedViewer.tsx',
  // We'll keep DocumentViewer, SpreadsheetViewer, and CodeViewer for now
  // since they're specialized implementations
  'src/components/viewers/DocumentViewer.tsx',
  'src/components/viewers/SpreadsheetViewer.tsx',
  'src/components/viewers/CodeViewer.tsx',
];

console.log('Starting cleanup of duplicate viewer files...');

// First, create backup directory
const backupDir = path.join(__dirname, 'backup-viewers');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Created backup directory: ${backupDir}`);
}

// Process each obsolete file
let successCount = 0;
let errorCount = 0;

for (const filePath of obsoleteFiles) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      // Create backup
      const fileName = path.basename(filePath);
      const backupPath = path.join(backupDir, fileName);
      fs.copyFileSync(fullPath, backupPath);
      
      // Remove the original file
      fs.unlinkSync(fullPath);
      console.log(`✓ Removed ${filePath} (backed up to ${backupPath})`);
      successCount++;
    } else {
      console.log(`⚠ File not found: ${filePath} (already removed)`);
    }
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
    errorCount++;
  }
}

console.log('\nViewer cleanup complete!');
console.log(`✓ Successfully processed ${successCount} files`);
if (errorCount > 0) {
  console.log(`❌ Encountered errors with ${errorCount} files`);
}
console.log('\nRemaining viewer files:');
for (const file of keepFiles) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(` - ${file}`);
  }
} 
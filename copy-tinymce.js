import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script copies TinyMCE files from node_modules to the public directory
console.log('Checking TinyMCE files...');

// Source and destination paths
const sourceDir = path.join(__dirname, 'node_modules', 'tinymce');
const destDir = path.join(__dirname, 'public', 'tinymce');

// Check if tinymce is already in public
const publicTinymceExists = fs.existsSync(destDir) && 
                            fs.existsSync(path.join(destDir, 'tinymce.min.js'));

// Check if tinymce is installed in node_modules
const tinymceInstalled = fs.existsSync(sourceDir);

// Skip if tinymce is not installed or public directory already has the files
if (!tinymceInstalled) {
  console.log('TinyMCE not found in node_modules. Checking for direct installation...');
  
  if (publicTinymceExists) {
    console.log('TinyMCE files found in public directory, using existing files');
  } else {
    console.warn('WARNING: TinyMCE not found in node_modules or public directory.');
    console.warn('The editor may not function properly. Try running npm install.');
  }
  process.exit(0);
}

if (publicTinymceExists) {
  console.log('TinyMCE files already exist in public directory, skipping copy operation');
  process.exit(0);
}

// Create destination directory if it doesn't exist
try {
  console.log('Copying TinyMCE files to public directory...');
  fs.mkdirSync(destDir, { recursive: true });

  // Function to copy directory recursively
  function copyRecursive(src, dest) {
    try {
      const exists = fs.existsSync(src);
      if (!exists) return;

      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(childItemName => {
          copyRecursive(
            path.join(src, childItemName),
            path.join(dest, childItemName)
          );
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    } catch (err) {
      console.error(`Error copying ${src} to ${dest}:`, err.message);
    }
  }

  // Copy only essential directories
  const essentialDirs = ['icons', 'models', 'plugins', 'skins', 'themes'];
  essentialDirs.forEach(dir => {
    const srcDir = path.join(sourceDir, dir);
    const dstDir = path.join(destDir, dir);
    if (fs.existsSync(srcDir)) {
      copyRecursive(srcDir, dstDir);
    }
  });

  // Also copy the main tinymce.min.js file
  const srcFile = path.join(sourceDir, 'tinymce.min.js');
  const dstFile = path.join(destDir, 'tinymce.min.js');
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, dstFile);
  }

  console.log('TinyMCE files copied successfully');
} catch (error) {
  console.error('Error copying TinyMCE files:', error.message);
  console.log('Attempting to continue despite copy error...');
} 
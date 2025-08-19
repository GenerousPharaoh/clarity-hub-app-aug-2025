/**
 * Environment check script to ensure all required files and configurations are present
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Checking environment configuration...');

// Check required directories and files
const requiredFiles = [
  { path: 'public/pdf/pdf.worker.min.js', purpose: 'PDF.js worker for PDF viewer' },
  { path: 'public/tinymce/tinymce.min.js', purpose: 'TinyMCE editor' },
  { path: '.env', purpose: 'Environment variables' },
];

let allFilesValid = true;
const missingFiles = [];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file.path);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ MISSING: ${file.path} - ${file.purpose}`);
    missingFiles.push(file);
    allFilesValid = false;
  } else {
    console.log(`✅ FOUND: ${file.path}`);
  }
}

// Check port configuration
const checkPorts = () => {
  try {
    const viteConfigPath = path.join(__dirname, 'vite.config.ts');
    if (!fs.existsSync(viteConfigPath)) {
      console.warn('⚠️ vite.config.ts not found, cannot check port configuration');
      return false;
    }
    
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Check if fixed ports are used in the config (which might cause conflicts)
    const hasFixedPorts = viteConfig.includes('port:') && !viteConfig.includes('strictPort: false');
    if (hasFixedPorts) {
      console.warn('⚠️ Using fixed ports in vite.config.ts may cause conflicts. Consider adding strictPort: false');
    } else {
      console.log('✅ Port configuration looks good');
    }
    
    return !hasFixedPorts;
  } catch (error) {
    console.error('Error checking port configuration:', error.message);
    return false;
  }
};

// If TinyMCE is missing, try to copy it
const copyTinyMCE = async () => {
  if (missingFiles.some(file => file.path.includes('tinymce'))) {
    console.log('Attempting to copy TinyMCE files...');
    try {
      // Import using dynamic import for ESM compatibility
      const { exec } = await import('child_process');
      
      // Run the copy script
      exec('node copy-tinymce.js', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running copy-tinymce.js: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(stdout);
        console.log('TinyMCE copy attempt completed');
      });
    } catch (error) {
      console.error('Error copying TinyMCE:', error.message);
    }
  }
};

// Check for PDF.js worker
const checkPdfJsWorker = () => {
  const pdfWorkerPath = path.join(__dirname, 'public/pdf/pdf.worker.min.js');
  
  if (!fs.existsSync(pdfWorkerPath)) {
    console.warn('⚠️ PDF.js worker not found. PDF viewer may not work properly.');
    console.log('Creating pdf directory...');
    
    try {
      // Create pdf directory if it doesn't exist
      fs.mkdirSync(path.join(__dirname, 'public/pdf'), { recursive: true });
      
      console.log('Please download the PDF.js worker from https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js');
      console.log('And place it in public/pdf/pdf.worker.min.js');
      
      return false;
    } catch (error) {
      console.error('Error creating pdf directory:', error.message);
      return false;
    }
  }
  
  return true;
};

// Run all checks
const portConfigValid = checkPorts();
const pdfWorkerValid = checkPdfJsWorker();

// Report results
console.log('\nEnvironment check results:');
console.log(`Required files: ${allFilesValid ? '✅ All found' : '⚠️ Some missing'}`);
console.log(`Port configuration: ${portConfigValid ? '✅ Valid' : '⚠️ Potential issues'}`);
console.log(`PDF.js worker: ${pdfWorkerValid ? '✅ Found' : '⚠️ Missing'}`);

// If any missing files, try to fix them
if (!allFilesValid) {
  console.log('\nAttempting to fix missing files...');
  await copyTinyMCE();
}

console.log('\nCheck completed!');

// Exit with appropriate code
process.exit(allFilesValid && portConfigValid && pdfWorkerValid ? 0 : 1);

async function checkEnvironment() {
  console.log('Starting environment check...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--window-size=1280,800']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => console.log(`BROWSER: ${msg.type().toUpperCase()} - ${msg.text()}`));
    page.on('pageerror', err => console.error(`PAGE ERROR: ${err.message}`));
    
    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Page loaded, checking render status...');
    
    // Check for successful rendering
    const appState = await page.evaluate(() => {
      // Check for error messages
      const errorElements = document.querySelectorAll('.MuiAlert-root.MuiAlert-standardError');
      const errorMessages = Array.from(errorElements).map(el => el.textContent);
      
      // Check for visible content
      const hasContent = document.body.textContent.trim().length > 0;
      const hasRoot = !!document.getElementById('root');
      const rootContent = hasRoot ? document.getElementById('root').innerHTML.length : 0;
      
      // Check for specific app elements
      const hasAppBar = !!document.querySelector('.MuiAppBar-root');
      const hasDrawer = !!document.querySelector('.MuiDrawer-root');
      const hasMainContent = !!document.querySelector('main');
      
      // Get document title
      const title = document.title;
      
      return {
        title,
        hasContent,
        hasRoot,
        rootContent,
        hasAppBar,
        hasDrawer,
        hasMainContent,
        errorMessages,
        isErrorState: errorMessages.length > 0,
        bodyClasses: document.body.className,
        loadStatus: document.readyState
      };
    });
    
    console.log('\nApp Render Status:');
    console.log('-----------------');
    console.log(`Title: ${appState.title}`);
    console.log(`Document ready state: ${appState.loadStatus}`);
    console.log(`Has content: ${appState.hasContent}`);
    console.log(`Root element present: ${appState.hasRoot}`);
    console.log(`Root content length: ${appState.rootContent}`);
    console.log(`Body classes: ${appState.bodyClasses}`);
    console.log('\nApp Components:');
    console.log(`- AppBar: ${appState.hasAppBar ? 'PRESENT' : 'MISSING'}`);
    console.log(`- Drawer: ${appState.hasDrawer ? 'PRESENT' : 'MISSING'}`);
    console.log(`- Main Content: ${appState.hasMainContent ? 'PRESENT' : 'MISSING'}`);
    
    if (appState.errorMessages.length > 0) {
      console.log('\nError Messages:');
      appState.errorMessages.forEach((msg, i) => {
        console.log(`  ${i+1}. ${msg}`);
      });
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-layout-initial.png', fullPage: true });
    console.log('\nScreenshot saved to test-layout-initial.png');
    
    // Test if panels exist and are functioning
    const panelStructure = await page.evaluate(() => {
      // Look for panels using common selectors
      const panels = {
        left: document.querySelector('.left-panel') || 
              document.querySelector('[data-testid="left-panel"]') ||
              document.querySelector('.MuiDrawer-root'),
        right: document.querySelector('.right-panel') || 
               document.querySelector('[data-testid="right-panel"]') ||
               document.querySelector('.MuiDrawer-paper:last-child')
      };
      
      return {
        leftPanel: panels.left ? {
          exists: true,
          visible: window.getComputedStyle(panels.left).display !== 'none',
          width: panels.left.getBoundingClientRect().width
        } : { exists: false },
        rightPanel: panels.right ? {
          exists: true,
          visible: window.getComputedStyle(panels.right).display !== 'none',
          width: panels.right.getBoundingClientRect().width
        } : { exists: false }
      };
    });
    
    console.log('\nPanel Structure:');
    console.log('-----------------');
    console.log('Left Panel:', panelStructure.leftPanel.exists 
                ? `PRESENT (${panelStructure.leftPanel.visible ? 'visible' : 'hidden'}, width: ${panelStructure.leftPanel.width}px)` 
                : 'MISSING');
    console.log('Right Panel:', panelStructure.rightPanel.exists 
                ? `PRESENT (${panelStructure.rightPanel.visible ? 'visible' : 'hidden'}, width: ${panelStructure.rightPanel.width}px)` 
                : 'MISSING');
    
    // Wait for manual inspection
    console.log('\nEnvironment check complete. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to exit');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error during environment check:', error);
  }
}

checkEnvironment(); 
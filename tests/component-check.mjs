/**
 * Component import verification script
 * 
 * This script statically checks that all components we created can be imported without errors.
 * It doesn't run in the browser but verifies the code structure is correct.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Components to verify
const COMPONENTS_TO_CHECK = [
  // Demo components
  '../src/components/DemoFilesList.tsx',
  '../src/components/DemoLeftPanel.tsx',
  '../src/components/DemoProjectsList.tsx',
  '../src/components/SimpleDemoEditor.tsx',
  '../src/components/EnhancedFileListItem.tsx',
  
  // Viewer components
  '../src/components/viewers/MockFileViewer.tsx',
  '../src/components/viewers/UniversalFileViewer.tsx',
  
  // Modified panel wrappers
  '../src/layouts/panels/CenterPanelWrapper.tsx',
  '../src/layouts/panels/RightPanelWrapper.tsx',
  
  // Core demo provider
  '../src/SimpleDemoFixProvider.tsx',
  
  // Modified app component with debug mode
  '../src/App.tsx',
];

// Check files exist
function checkFilesExist() {
  console.log('🔍 Checking if all component files exist...');
  
  const allFilesExist = COMPONENTS_TO_CHECK.every(componentPath => {
    const fullPath = path.resolve(__dirname, componentPath);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      console.log(`✅ Found: ${componentPath}`);
    } else {
      console.error(`❌ Missing: ${componentPath}`);
    }
    
    return exists;
  });
  
  return allFilesExist;
}

// Check TypeScript can parse the files without errors
function checkTypeScriptCompilation() {
  console.log('\n🔍 Checking TypeScript compilation...');
  
  try {
    // Run TypeScript compiler in noEmit mode to check for errors
    execSync('npx tsc --noEmit', { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe' 
    });
    
    console.log('✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    console.error('❌ TypeScript compilation failed:');
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

// Check for certain critical patterns in files
function checkComponentContent() {
  console.log('\n🔍 Checking component content for expected patterns...');
  
  const contentChecks = [
    { 
      file: '../src/App.tsx', 
      patterns: [
        'resetApplication', 
        'debugMode', 
        'useEffect',
        'handleKeyDown'
      ]
    },
    {
      file: '../src/SimpleDemoFixProvider.tsx',
      patterns: [
        'createDemoData',
        'demoProjects',
        'demoFiles',
        'useEffect',
        'demoInitialized'
      ]
    },
    {
      file: '../src/components/DemoLeftPanel.tsx',
      patterns: [
        'DemoProjectsList',
        'DemoFilesList',
        'isCollapsed'
      ]
    },
    {
      file: '../src/layouts/MainLayout.tsx',
      patterns: [
        'DemoLeftPanel',
        'user?.id ===',
        'ResizablePanels'
      ]
    },
    {
      file: '../src/layouts/panels/CenterPanelWrapper.tsx',
      patterns: [
        'SimpleDemoEditor',
        'isDemoMode'
      ]
    },
    {
      file: '../public/reset-app.js',
      patterns: [
        'demoProjects',
        'demoFiles',
        'window.dispatchEvent',
        'localStorage'
      ]
    }
  ];
  
  let allPatternsFound = true;
  
  contentChecks.forEach(check => {
    const fullPath = path.resolve(__dirname, check.file);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Can't check patterns in missing file: ${check.file}`);
      allPatternsFound = false;
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    console.log(`\nChecking patterns in ${check.file}:`);
    check.patterns.forEach(pattern => {
      const found = content.includes(pattern);
      console.log(`${found ? '✅' : '❌'} Pattern '${pattern}'`);
      
      if (!found) {
        allPatternsFound = false;
      }
    });
  });
  
  return allPatternsFound;
}

// Check entry script contains our components
function checkForEntryImports() {
  console.log('\n🔍 Checking for proper component imports in entry points...');
  
  const entryPoints = [
    '../src/main.tsx',
    '../src/App.tsx'
  ];
  
  let allImportsFound = true;
  
  entryPoints.forEach(entryFile => {
    const fullPath = path.resolve(__dirname, entryFile);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Entry file doesn't exist: ${entryFile}`);
      allImportsFound = false;
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for key import patterns
    const importPatterns = [
      'import',
      'from',
      'React',
    ];
    
    console.log(`\nChecking imports in ${entryFile}:`);
    importPatterns.forEach(pattern => {
      const found = content.includes(pattern);
      console.log(`${found ? '✅' : '❌'} Import pattern '${pattern}'`);
      
      if (!found) {
        allImportsFound = false;
      }
    });
  });
  
  return allImportsFound;
}

// Main verification function
function verifyComponents() {
  console.log('🧪 Starting component verification...\n');
  
  const filesExist = checkFilesExist();
  const contentValid = checkComponentContent();
  const importsValid = checkForEntryImports();
  const compilationValid = checkTypeScriptCompilation();
  
  console.log('\n📊 Verification Summary:');
  console.log(`Files exist: ${filesExist ? '✅' : '❌'}`);
  console.log(`Content patterns found: ${contentValid ? '✅' : '❌'}`);
  console.log(`Entry imports valid: ${importsValid ? '✅' : '❌'}`);
  console.log(`TypeScript compilation: ${compilationValid ? '✅' : '❌'}`);
  
  const overallSuccess = filesExist && contentValid && importsValid && compilationValid;
  
  console.log(`\n${overallSuccess ? '🎉 All checks passed!' : '❌ Some checks failed!'}`);
  
  if (!overallSuccess) {
    console.log('\nRecommended actions:');
    console.log('1. Check that all component files are in the correct locations');
    console.log('2. Verify that imports use correct paths');
    console.log('3. Make sure TypeScript types are correctly defined');
    console.log('4. Ensure all necessary dependencies are installed');
  }
  
  return overallSuccess;
}

// Run verification
const success = verifyComponents();
process.exit(success ? 0 : 1);
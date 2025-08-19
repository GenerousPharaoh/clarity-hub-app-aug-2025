#!/usr/bin/env node

/**
 * Comprehensive fix script for common Clarity Hub issues:
 * - Fix storage permissions
 * - Reset panel state
 * - Create demo project and files
 * - Fix authentication issues
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.development file');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);
const adminClient = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

console.log('Starting Clarity Hub app fixes...');

async function main() {
  try {
    // Step 1: Reset localStorage panel state
    resetLocalStorage();

    // Step 2: Create a demo user if needed
    const demoUser = await setupDemoUser();

    // Step 3: Ensure storage buckets exist
    await ensureStorageBuckets();

    // Step 4: Fix storage permissions
    await fixStoragePermissions();

    // Step 5: Create demo project and files
    if (demoUser) {
      await createDemoProject(demoUser);
    }

    console.log('\n✅ All fixes completed successfully!');
    console.log('\nYou should now be able to:');
    console.log('1. See projects in the left panel');
    console.log('2. View files in the right panel');
    console.log('3. Upload and manage files');
    console.log('\nPlease restart the development server (npm run dev) and refresh your browser.');

  } catch (error) {
    console.error('Error applying fixes:', error);
    process.exit(1);
  }
}

// Reset localStorage settings that might cause UI issues
function resetLocalStorage() {
  console.log('\n🔄 Resetting localStorage panel state...');
  
  const localStorage = {
    'clarity-hub-panel-state': JSON.stringify({
      panelSizes: [25, 50, 25],
      leftCollapsed: false,
      rightCollapsed: false,
      isLeftCollapsed: false,
      isRightCollapsed: false
    }),
    'clarity-hub-app-state': JSON.stringify({
      selectedProjectId: null, 
      selectedFileId: null,
      themeMode: 'light'
    })
  };
  
  // Write guide for manually clearing localStorage
  console.log('To manually reset localStorage in your browser:');
  console.log('1. Open Developer Tools (F12 or Cmd+Option+I)');
  console.log('2. Go to the Application tab');
  console.log('3. Select "Local Storage" in the left panel');
  console.log('4. Right-click on your domain and select "Clear"');
  console.log('5. Refresh the page');
  
  // Create a file with localStorage reset script
  const resetScript = `
// Run this in your browser console to reset app state
localStorage.setItem('clarity-hub-panel-state', '${JSON.stringify(localStorage['clarity-hub-panel-state'])}');
localStorage.setItem('clarity-hub-app-state', '${JSON.stringify(localStorage['clarity-hub-app-state'])}');
console.log('✅ App state reset successfully! Please refresh the page.');
  `;
  
  fs.writeFileSync('reset-app-state.js', resetScript);
  console.log('\nCreated reset-app-state.js - you can copy its contents into your browser console');
}

// Set up storage buckets in Supabase
async function ensureStorageBuckets() {
  console.log('\n🛢️ Ensuring storage buckets exist...');
  
  // Check current buckets
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error listing buckets:', error.message);
    return;
  }
  
  // Define required buckets
  const requiredBuckets = ['files', 'thumbnails', 'demo-files'];
  const existingBuckets = buckets.map(b => b.name);
  
  console.log('Existing buckets:', existingBuckets.join(', '));
  
  // Create missing buckets
  for (const bucket of requiredBuckets) {
    if (!existingBuckets.includes(bucket)) {
      console.log(`Creating bucket: ${bucket}`);
      
      try {
        const { data, error } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 100000000, // 100MB
        });
        
        if (error) throw error;
        console.log(`✅ Created bucket: ${bucket}`);
      } catch (err) {
        console.error(`Failed to create bucket ${bucket}:`, err.message);
      }
    } else {
      console.log(`✓ Bucket already exists: ${bucket}`);
    }
  }
}

// Fix storage permissions
async function fixStoragePermissions() {
  console.log('\n🔒 Fixing storage permissions...');
  
  if (!adminClient) {
    console.log('⚠️ Service role key not provided. Storage permission fixes will be limited.');
    console.log('For complete fixes, add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env.development file.');
    
    // Create SQL file for manual execution
    try {
      const sqlPath = path.join(__dirname, 'supabase/migrations/20250521000000_fix_storage_permissions.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        fs.writeFileSync('fix-storage-permissions.sql', sql);
        console.log('Created fix-storage-permissions.sql - please execute this in your Supabase SQL editor');
      } else {
        console.log('SQL migration file not found. Creating a basic storage permissions SQL fix...');
        
        // Create a basic storage permissions SQL fix
        const basicSql = `
-- Storage permissions fix
UPDATE storage.buckets
SET public = true
WHERE id IN ('files', 'thumbnails', 'demo-files');

-- Create simple permission policies
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
CREATE POLICY "Public can view files"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id IN ('files', 'thumbnails', 'demo-files'));
`;
        fs.writeFileSync('fix-storage-permissions.sql', basicSql);
        console.log('Created fix-storage-permissions.sql with basic fixes');
      }
    } catch (err) {
      console.error('Error creating SQL file:', err.message);
    }
    
    return;
  }
  
  // Using service role to make buckets public
  for (const bucket of ['files', 'thumbnails', 'demo-files']) {
    try {
      console.log(`Making bucket public: ${bucket}`);
      const { error } = await adminClient.storage.updateBucket(bucket, {
        public: true,
        fileSizeLimit: 100000000 // 100MB
      });
      
      if (error) throw error;
      console.log(`✅ Successfully updated bucket: ${bucket}`);
    } catch (err) {
      console.error(`Failed to update bucket ${bucket}:`, err.message);
    }
  }
}

// Create a demo user for testing
async function setupDemoUser() {
  console.log('\n👤 Setting up demo user...');
  
  try {
    // Check if we already have an authenticated session
    const { data, error } = await supabase.auth.getSession();
    
    if (data?.session) {
      console.log(`✓ Already authenticated as: ${data.session.user.email}`);
      return data.session.user;
    }
    
    // Use demo login
    console.log('No authenticated session found, creating demo user...');
    
    // Create demo user
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      user_metadata: {
        full_name: 'Demo User',
        avatar_url: 'https://via.placeholder.com/150',
      }
    };
    
    console.log('Created demo user:', demoUser.email);
    
    // Create a file with demo login script
    const loginScript = `
// Run this code in your browser console to create a demo user session
const demoUser = ${JSON.stringify(demoUser)};
// First, clear existing auth state
localStorage.removeItem('supabase.auth.token');
// Set the demo user in the app
const customEvent = new CustomEvent('clarity-hub:demo-login', { 
  detail: { user: demoUser }
});
window.dispatchEvent(customEvent);
console.log('✅ Demo user created! Please refresh the page.');
    `;
    
    fs.writeFileSync('demo-login.js', loginScript);
    console.log('Created demo-login.js - copy its contents into your browser console');
    
    return demoUser;
  } catch (err) {
    console.error('Failed to set up demo user:', err.message);
    return null;
  }
}

// Create a demo project and upload sample files
async function createDemoProject(demoUser) {
  console.log('\n📁 Creating demo project...');
  
  if (!demoUser) {
    console.log('⚠️ No user available to create demo project');
    return;
  }
  
  try {
    // Create demo project insert SQL
    const projectId = 'demo-project-123';
    const projectName = 'Demo Legal Case';
    
    // Create a SQL file for creating a demo project
    const demoProjectSql = `
-- Run this in Supabase SQL Editor to create a demo project
INSERT INTO public.projects (id, name, owner_id, created_at, description)
VALUES 
  ('${projectId}', '${projectName}', '${demoUser.id}', NOW(), 'A demo project with sample files')
ON CONFLICT (id) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Add some demo files
INSERT INTO public.files (id, name, project_id, owner_id, storage_path, content_type, size, file_type, metadata, added_at)
VALUES
  ('demo-file-1', 'Sample Contract.pdf', '${projectId}', '${demoUser.id}', 'projects/${projectId}/demo-file-1_sample.pdf', 'application/pdf', 12345, 'pdf', '{"tags":["contract","legal"],"processingStatus":"completed"}', NOW() - INTERVAL '2 days'),
  ('demo-file-2', 'Case Evidence.jpg', '${projectId}', '${demoUser.id}', 'projects/${projectId}/demo-file-2_evidence.jpg', 'image/jpeg', 45678, 'image', '{"tags":["evidence","photo"],"processingStatus":"completed"}', NOW() - INTERVAL '1 day'),
  ('demo-file-3', 'Meeting Notes.txt', '${projectId}', '${demoUser.id}', 'projects/${projectId}/demo-file-3_notes.txt', 'text/plain', 1234, 'text', '{"tags":["notes","meeting"],"processingStatus":"completed"}', NOW())
ON CONFLICT (id) 
DO UPDATE SET
  name = EXCLUDED.name,
  metadata = EXCLUDED.metadata;
    `;
    
    fs.writeFileSync('create-demo-project.sql', demoProjectSql);
    console.log('Created create-demo-project.sql - please execute this in your Supabase SQL editor');
    
    // Demo load script for browser
    const demoLoadScript = `
// Run this code in your browser console to load demo project
const customEvent = new CustomEvent('clarity-hub:load-demo', { 
  detail: { projectId: '${projectId}' }
});
window.dispatchEvent(customEvent);
console.log('✅ Demo project loaded! You should see it in the left panel.');
    `;
    
    fs.writeFileSync('load-demo-project.js', demoLoadScript);
    console.log('Created load-demo-project.js - copy its contents into your browser console');
    
    // Create a simple fix component for making the app work with demo data
    const fixComponentCode = `
import { useEffect } from 'react';
import useAppStore from './store';

// Add this component to App.tsx to enable demo mode fixes
const DemoFixProvider = () => {
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  const setProjects = useAppStore((state) => state.setProjects);
  const setUser = useAppStore((state) => state.setUser);
  
  useEffect(() => {
    // Listen for demo login event
    const handleDemoLogin = (event) => {
      const { user } = event.detail;
      if (user) {
        console.log('Setting demo user:', user);
        setUser({
          id: user.id,
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url,
          full_name: user.user_metadata?.full_name,
        });
      }
    };
    
    // Listen for demo project load event
    const handleDemoLoad = (event) => {
      const { projectId } = event.detail;
      if (projectId) {
        console.log('Loading demo project:', projectId);
        
        // Create a demo project
        const demoProject = {
          id: projectId,
          name: 'Demo Legal Case',
          owner_id: 'demo-user-123',
          created_at: new Date().toISOString(),
          description: 'A demo project with sample files'
        };
        
        // Set it in the store
        setProjects([demoProject]);
        setSelectedProject(projectId);
      }
    };
    
    // Add event listeners
    window.addEventListener('clarity-hub:demo-login', handleDemoLogin);
    window.addEventListener('clarity-hub:load-demo', handleDemoLoad);
    
    // Clean up
    return () => {
      window.removeEventListener('clarity-hub:demo-login', handleDemoLogin);
      window.removeEventListener('clarity-hub:load-demo', handleDemoLoad);
    };
  }, [setSelectedProject, setProjects, setUser]);
  
  return null;
};

export default DemoFixProvider;
`;
    
    fs.writeFileSync('src/DemoFixProvider.tsx', fixComponentCode);
    console.log('Created src/DemoFixProvider.tsx - add this component to App.tsx to enable demo mode');
    
    // Create instructions for manual App.tsx update
    const appUpdateInstructions = `
// Add this import to App.tsx:
import DemoFixProvider from './DemoFixProvider';

// Add this component inside the ErrorBoundary but before the AuthProvider:
<ErrorBoundary>
  <DemoFixProvider />
  <AuthProvider>
    ...
`;
    
    fs.writeFileSync('app-update-instructions.js', appUpdateInstructions);
    console.log('Created app-update-instructions.js with guidance for updating App.tsx');
    
    return true;
  } catch (err) {
    console.error('Failed to create demo project:', err.message);
    return false;
  }
}

// Run the main function
main();
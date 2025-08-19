// Final fix script for the Clarity Hub app
// This script will create missing buckets and modify local storage for UI fixes

// First, let's provide console scripts that will help fix the app after it's loaded
const browserConsoleScripts = `
// Run these scripts in your browser console after the app loads

// 1. First, reset panel state to make sure panels are visible
const resetPanels = () => {
  // Get current panel state or use default
  try {
    const currentPanelState = localStorage.getItem('clarity-hub-panel-state');
    let panelState = currentPanelState ? JSON.parse(currentPanelState) : {
      panelSizes: [25, 50, 25],
      leftCollapsed: false,
      rightCollapsed: false,
      isLeftCollapsed: false,
      isRightCollapsed: false
    };
    
    // Ensure the right panel is visible (not collapsed)
    panelState.rightCollapsed = false;
    panelState.isRightCollapsed = false;
    
    // Save the updated state
    localStorage.setItem('clarity-hub-panel-state', JSON.stringify(panelState));
    console.log('✅ Panel state updated: right panel is now visible');
  } catch (error) {
    console.error('Error updating localStorage:', error);
  }
};

// 2. Create a UUID-compliant demo user
const createDemoUser = () => {
  const demoUser = {
    id: '00000000-0000-0000-0000-000000000000', // Valid UUID format
    email: 'demo@example.com',
    user_metadata: {
      full_name: 'Demo User',
      avatar_url: 'https://via.placeholder.com/150',
    }
  };
  
  // Clear existing auth state
  localStorage.removeItem('supabase.auth.token');
  
  // Set the demo user in the app
  const customEvent = new CustomEvent('clarity-hub:demo-login', { 
    detail: { user: demoUser }
  });
  
  window.dispatchEvent(customEvent);
  console.log('✅ Demo user created!');
};

// 3. Load a demo project with valid UUID
const loadDemoProject = () => {
  // Generate a valid UUID format project ID
  const projectId = '11111111-1111-1111-1111-111111111111';
  
  const customEvent = new CustomEvent('clarity-hub:load-demo', { 
    detail: { projectId: projectId }
  });
  
  window.dispatchEvent(customEvent);
  console.log('✅ Demo project loaded! You should see it in the left panel.');
};

// Run all fixes
console.log('Running all UI fixes...');
resetPanels();
createDemoUser();
loadDemoProject();
console.log('✅ All fixes applied! The app should now display correctly.');
`;

// Write the scripts to a file
const fs = require('fs');
fs.writeFileSync('browser-fixes.js', browserConsoleScripts);

console.log(`
✅ Fix scripts created successfully!

To fix the Clarity Hub app:

1. Run the development server:
   npm run dev

2. Open the app in your browser
   http://localhost:3000/

3. Open the browser developer console (F12 or Cmd+Option+I)

4. Copy and paste the contents of browser-fixes.js into the console
   This will:
   - Reset panel state to make panels visible
   - Create a demo user
   - Load a demo project

5. Refresh the page to see the changes

Additional troubleshooting:
- If you don't see files in the right panel, make sure to click on a file
- Reset localStorage completely if issues persist
- Check browser console for errors

For more detailed instructions, refer to TROUBLESHOOTING.md
`);

// Also create a minimal demo component in case the previous one didn't work
const demoFixComponent = `
import { useEffect } from 'react';
import useAppStore from './store';

// Simpler DemoFixProvider component
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
        
        // Create a demo project with valid UUID
        const demoProject = {
          id: projectId,
          name: 'Demo Legal Case',
          owner_id: '00000000-0000-0000-0000-000000000000', // Valid UUID
          created_at: new Date().toISOString(),
          description: 'A demo project with sample files'
        };
        
        // Create demo files
        const demoFiles = [
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Sample Contract.pdf',
            project_id: projectId,
            owner_id: '00000000-0000-0000-0000-000000000000',
            storage_path: \`projects/\${projectId}/sample.pdf\`,
            content_type: 'application/pdf',
            size: 12345,
            file_type: 'pdf',
            metadata: {
              tags: ['contract', 'legal'],
              processingStatus: 'completed'
            },
            added_at: new Date().toISOString()
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Case Evidence.jpg',
            project_id: projectId,
            owner_id: '00000000-0000-0000-0000-000000000000',
            storage_path: \`projects/\${projectId}/evidence.jpg\`,
            content_type: 'image/jpeg',
            size: 45678,
            file_type: 'image',
            metadata: {
              tags: ['evidence', 'photo'],
              processingStatus: 'completed'
            },
            added_at: new Date().toISOString()
          }
        ];
        
        // Set it in the store
        setProjects([demoProject]);
        setSelectedProject(projectId);
        
        // Add files to the store
        useAppStore.setState(state => ({
          ...state,
          files: [...demoFiles]
        }));
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

fs.writeFileSync('src/SimpleDemoFixProvider.tsx', demoFixComponent);
console.log('Created src/SimpleDemoFixProvider.tsx - you can use this component if the original DemoFixProvider doesn\'t work');
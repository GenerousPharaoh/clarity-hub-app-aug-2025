
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

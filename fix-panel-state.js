// Script to reset panel settings in the app

// This script updates the right panel state to make sure files are visible
const resetLocalStorage = () => {
  console.log('Resetting panel state...');
  
  // Fix any right panel visibility issues by ensuring it's not collapsed
  try {
    // Get current panel state or use default
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
    
    return true;
  } catch (error) {
    console.error('Error updating localStorage:', error);
    return false;
  }
};

// Export for use in browser
if (typeof window !== 'undefined') {
  window.resetPanelState = resetLocalStorage;
  console.log('Run resetPanelState() to make sure the right panel is visible');
}

// For running directly
if (typeof process !== 'undefined') {
  console.log(`
To reset panel state in the browser, run this code in your console:

const resetPanelState = () => {
  console.log('Resetting panel state...');
  
  // Fix any right panel visibility issues by ensuring it's not collapsed
  try {
    // Get current panel state or use default
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
    
    return true;
  } catch (error) {
    console.error('Error updating localStorage:', error);
    return false;
  }
};

resetPanelState();
console.log('✅ Right panel should now be visible. Please refresh the page.');
  `);
}
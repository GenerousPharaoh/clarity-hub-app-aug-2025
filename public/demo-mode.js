// Demo Mode Activation Script
// This enables demo mode for the Clarity Hub app

// Set demo mode flag
window.DEMO_MODE = true;
window.FORCE_DEMO_MODE = true;

console.log('🎯 Demo Mode Activated!');
console.log('Demo User ID: 11111111-1111-1111-1111-111111111111');
console.log('Demo Project ID: 22222222-2222-2222-2222-222222222222');

// Trigger demo initialization after app loads
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // Dispatch custom event to initialize demo
    window.dispatchEvent(new CustomEvent('clarity-hub:initialize-demo', {
      detail: { forceInit: true }
    }));
    
    console.log('✅ Demo initialization triggered');
  }, 500);
});
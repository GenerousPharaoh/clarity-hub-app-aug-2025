
// Run this code in your browser console to load demo project
const customEvent = new CustomEvent('clarity-hub:load-demo', { 
  detail: { projectId: 'demo-project-123' }
});
window.dispatchEvent(customEvent);
console.log('✅ Demo project loaded! You should see it in the left panel.');
    
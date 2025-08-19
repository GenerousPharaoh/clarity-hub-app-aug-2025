
// Run this code in your browser console to create a demo user session
const demoUser = {"id":"demo-user-123","email":"demo@example.com","user_metadata":{"full_name":"Demo User","avatar_url":"https://via.placeholder.com/150"}};
// First, clear existing auth state
localStorage.removeItem('supabase.auth.token');
// Set the demo user in the app
const customEvent = new CustomEvent('clarity-hub:demo-login', { 
  detail: { user: demoUser }
});
window.dispatchEvent(customEvent);
console.log('✅ Demo user created! Please refresh the page.');
    
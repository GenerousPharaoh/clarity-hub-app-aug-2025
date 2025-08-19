
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

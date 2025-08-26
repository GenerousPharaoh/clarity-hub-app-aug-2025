import * as React from 'react';
import { CssBaseline, Button, Box } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Modern theme system for sophisticated legal software
import { ThemeProvider } from '@mui/material/styles';
import { createModernTheme } from './theme/modernTheme';
import ProfessionalGlobalStyles from './theme/GlobalStyles';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CollaborationProvider } from './contexts/CollaborationContext';
import AppRoutes from './components/AppRoutes';
import useAppStore from './store';
import './styles/editor.css';

// Add type definition for window.DEMO_MODE
declare global {
  interface Window {
    DEMO_MODE?: boolean;
  }
}

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  const { initializeDemoProject } = useAppStore();
  
  // Demo mode disabled
  // React.useEffect(() => {
  //   if (window.DEMO_MODE || window.FORCE_DEMO_MODE) {
  //     console.log('🚀 Initializing demo project in App.tsx');
  //     initializeDemoProject();
  //   }
  // }, [initializeDemoProject]);
  
  // Debug mode state - enable in demo mode
  const [debugMode, setDebugMode] = React.useState(true);
  
  // Get theme mode from store
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  
  // Demo mode disabled
  /*
  React.useEffect(() => {
    console.log('App initialized in demo mode');
    
    const initializeDemoMode = async () => {
      // Initialize demo storage
      await demoStorage.initializeDemoData();
      
      // Create a demo user for testing
      const demoUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'demo@example.com',
        avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff',
        full_name: 'Demo User',
      };
      
      // Set the user in the store directly
      useAppStore.setState({
        user: demoUser,
      });
      
      // Load persistent demo data
      try {
        const [projects, files] = await Promise.all([
          demoStorage.getProjects(),
          demoStorage.getFiles('11111111-1111-1111-1111-111111111111')
        ]);

        // Convert demo files to app format
        const appFiles = files.map(demoFile => ({
          id: demoFile.id,
          name: demoFile.name,
          project_id: demoFile.project_id,
          owner_id: '00000000-0000-0000-0000-000000000000',
          file_type: demoFile.type.split('/')[0],
          content_type: demoFile.type,
          size: demoFile.size,
          storage_path: `demo/${demoFile.id}`,
          added_at: demoFile.uploaded_at,
          exhibit_id: demoFile.exhibit_id,
          exhibit_title: demoFile.exhibit_title
        }));

        // Set persistent data in store
        useAppStore.setState({
          projects,
          files: appFiles,
          selectedProjectId: '11111111-1111-1111-1111-111111111111'
        });

        console.log('Demo data loaded:', { 
          projects: projects.length, 
          files: appFiles.length 
        });
      } catch (error) {
        console.error('Failed to load demo data:', error);
        
        // Fallback to basic demo data
        const projectId = '11111111-1111-1111-1111-111111111111';
        const fallbackProjects = [
          {
            id: projectId,
            name: 'Acme Corp. v. Widget Industries',
            owner_id: demoUser.id,
            created_at: new Date().toISOString(),
            description: 'Contract dispute regarding manufacturing components',
            status: 'active'
          }
        ];
        
        useAppStore.setState({
          projects: fallbackProjects,
          files: [],
          selectedProjectId: projectId
        });
      }
    };

    initializeDemoMode();
  }, []);
  */
  
  // Function to load and execute the reset script
  const resetApplication = () => {
    const script = document.createElement('script');
    script.src = '/reset-app.js';
    script.onload = () => {
      console.log('Reset script loaded and executed');
      script.remove(); // Clean up script tag
    };
    script.onerror = () => {
      console.error('Failed to load reset script');
      script.remove(); // Clean up script tag
    };
    document.body.appendChild(script);
  };

  // Toggle debug mode with key combination (Ctrl+Shift+D)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugMode(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  


  // Modern sophisticated theme for legal software
  const modernTheme = React.useMemo(() => 
    createModernTheme(themeMode), 
    [themeMode]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={modernTheme}>
        <CssBaseline />
        <ProfessionalGlobalStyles />
        
        {/* Debug mode controls */}
        {debugMode && (
          <Box 
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              right: 16, 
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={toggleTheme}
              sx={{ 
                fontWeight: 'bold',
                boxShadow: 2,
                mb: 1
              }}
            >
              {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={resetApplication}
              startIcon={<SettingsIcon />}
              sx={{ 
                fontWeight: 'bold',
                boxShadow: 2
              }}
            >
              Reset App
            </Button>
          </Box>
        )}
        
        <ErrorBoundary>
          <NotificationProvider>
            {/* <SimpleDemoFixProvider /> */}
            <AuthProvider>
              <CollaborationProvider>
                <AppRoutes />
              </CollaborationProvider>
            </AuthProvider>
          </NotificationProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles, Button, Box } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import getTheme from './theme';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import SimpleDemoFixProvider from './SimpleDemoFixProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import useAppStore from './store';
import ProjectLayout from './layouts/ProjectLayout';

// Lazy-loaded components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Auth = React.lazy(() => import('./pages/auth/Auth'));
const ProjectView = React.lazy(() => import('./pages/ProjectView'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

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
  // Get theme mode from store
  const themeMode = useAppStore((state) => state.themeMode);
  
  // Create theme based on selected mode
  const theme = React.useMemo(() => getTheme(themeMode), [themeMode]);
  
  // Debug mode state - enable in demo mode
  const [debugMode, setDebugMode] = React.useState(true);
  
  // Set up demo mode on first render
  React.useEffect(() => {
    console.log('App initialized in demo mode');
    
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
    
    // Create demo projects
    const projectId = '11111111-1111-1111-1111-111111111111';
    const demoProjects = [
      {
        id: projectId,
        name: 'Acme Corp. v. Widget Industries',
        owner_id: demoUser.id,
        created_at: new Date().toISOString(),
        description: 'Contract dispute regarding manufacturing components',
        status: 'active'
      }
    ];
    
    // Create demo files
    const demoFiles = [
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Client Contract.pdf',
        project_id: projectId,
        owner_id: demoUser.id,
        file_type: 'pdf',
        content_type: 'application/pdf',
        size: 12345,
        added_at: new Date().toISOString(),
      }
    ];
    
    // Set projects and files in the store
    useAppStore.setState({
      projects: demoProjects,
      files: demoFiles,
      selectedProjectId: projectId
    });
  }, []);
  
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
  
  // Global styles for app
  const globalStyles = (
    <GlobalStyles 
      styles={{
        '#root': {
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        // Prevent iOS overscroll/bounce effect
        'html, body': {
          overscrollBehavior: 'none',
          height: '100vh',
          width: '100vw',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
        },
        // Improved scrollbars
        '::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f1f1f1',
        },
        '::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? '#555' : '#c1c1c1',
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: theme.palette.mode === 'dark' ? '#777' : '#a8a8a8',
        },
      }} 
    />
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {globalStyles}
        
        {/* Debug mode reset button */}
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
            <SimpleDemoFixProvider />
            <AuthProvider>
              <React.Suspense fallback={<div className="app-loading">Loading...</div>}>
                <Routes>
                  {/* Auth routes */}
                  <Route path="/auth/*" element={<Auth />} />
                  
                  {/* Main app routes */}
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Dashboard />} />
                  </Route>
                  
                  {/* Project routes with specialized layout */}
                  <Route path="/projects/:projectId/*" element={<ProjectLayout />}>
                    <Route index element={<ProjectView />} />
                  </Route>
                  
                  {/* Fallback routes */}
                  <Route path="/not-found" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/not-found" replace />} />
                </Routes>
              </React.Suspense>
            </AuthProvider>
          </NotificationProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

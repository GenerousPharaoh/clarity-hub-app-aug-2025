import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Button, Box } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Modern theme system for sophisticated legal software
import { ThemeProvider } from '@mui/material/styles';
import { createModernTheme } from './theme/modernTheme';
import ProfessionalGlobalStyles from './theme/GlobalStyles';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import SimpleDemoFixProvider from './SimpleDemoFixProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import { CollaborationProvider } from './contexts/CollaborationContext';
import useAppStore from './store';
import ProjectLayout from './layouts/ProjectLayout';
import './styles/editor.css';

// Lazy-loaded components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Auth = React.lazy(() => import('./pages/auth/Auth'));
const ProjectView = React.lazy(() => import('./pages/ProjectView'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Help = React.lazy(() => import('./pages/Help'));
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
  
  // Debug mode state - enable in demo mode
  const [debugMode, setDebugMode] = React.useState(true);
  
  // Get theme mode from store
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  
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
            <SimpleDemoFixProvider />
            <AuthProvider>
              <CollaborationProvider>
                <React.Suspense fallback={<div className="app-loading">Loading...</div>}>
                  <Routes>
                    {/* Auth routes */}
                    <Route path="/auth/*" element={<Auth />} />
                    
                    {/* Main app routes */}
                    <Route path="/" element={<MainLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="messages" element={<Messages />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="help" element={<Help />} />
                      <Route path="project/:projectId" element={<ProjectView />} />
                      <Route path="profile" element={<Settings />} />
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
              </CollaborationProvider>
            </AuthProvider>
          </NotificationProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

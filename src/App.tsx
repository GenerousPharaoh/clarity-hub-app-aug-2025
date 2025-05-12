import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Snackbar, Alert } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { lightTheme, darkTheme } from './theme/index';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NotificationProvider from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import useAppStore from './store';
import FileUploadStatus from './components/FileUploadStatus';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { isAdminUser } from './services/supabaseClient';
import errorHandlingService, { AppError, ErrorType } from './services/errorHandlingService';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import NotFound from './pages/NotFound';
import AITestPage from './pages/AITestPage';
import ReportBug from './pages/ReportBug';
import DebugFilesPage from './pages/DebugFilesPage';

// Create a ProjectListPage component that's just a wrapper around MainLayout
// This way the MainLayout will handle showing the welcome screen for the root route
const ProjectListPage = () => <MainLayout />;

// Page transition component
const PageTransition = ({ children }) => (
  <div
    style={{
      animationName: 'fadeIn',
      animationDuration: '0.3s',
      animationFillMode: 'both',
    }}
  >
    {children}
  </div>
);

// Add global styles for animations
const GlobalStyle = () => {
  const styleElement = document.createElement('style');
  
  styleElement.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  
  document.head.appendChild(styleElement);
  
  return null;
};

// Configure the query client with global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute
      onError: (error) => {
        errorHandlingService.handleApiError(error as Error);
      }
    },
    mutations: {
      onError: (error) => {
        errorHandlingService.handleApiError(error as Error);
      }
    }
  },
});

// Admin-only route
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    if (user) {
      // Check if user is admin
      isAdminUser().then(admin => {
        setIsAdmin(admin);
      });
    }
  }, [user]);
  
  // If still loading, show nothing
  if (loading) return null;
  
  // If no user or not admin, redirect to login
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const themeMode = useAppStore((state) => state.themeMode);
  const theme = themeMode === 'light' ? lightTheme : darkTheme;
  const [globalError, setGlobalError] = useState<AppError | null>(null);

  // Handle global errors
  const handleGlobalError = useCallback((error: Error) => {
    // Only show user-visible errors in UI
    if (error instanceof AppError) {
      setGlobalError(error);
      
      // Auto-clear certain types of errors after a delay
      if (
        error.type === ErrorType.NETWORK ||
        error.type === ErrorType.API
      ) {
        setTimeout(() => {
          setGlobalError(null);
        }, 5000);
      }
      
      // Handle special error cases
      if (errorHandlingService.shouldRedirectToLogin(error)) {
        // Will be handled by auth context/protected routes
        console.log('Error requires re-authentication');
      }
      
      if (errorHandlingService.shouldTriggerReload(error)) {
        // For truly fatal errors, reload the page after a delay
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    }
  }, []);
  
  // Register global error handler
  useEffect(() => {
    const unsubscribe = errorHandlingService.onError(handleGlobalError);
    return () => unsubscribe();
  }, [handleGlobalError]);
  
  // Clear error when user dismisses
  const handleCloseError = () => {
    setGlobalError(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary 
        onError={errorHandlingService.handleComponentError}
        resetOnPropsChange={true}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <GlobalStyle />
          <NotificationProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <AuthProvider>
                <Routes>
                  {/* Auth routes */}
                  <Route 
                    path="/login" 
                    element={
                      <PageTransition>
                        <Login />
                      </PageTransition>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PageTransition>
                        <Register />
                      </PageTransition>
                    } 
                  />
                  <Route 
                    path="/reset-password" 
                    element={
                      <PageTransition>
                        <ResetPassword />
                      </PageTransition>
                    } 
                  />
                  
                  {/* Protected routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <PageTransition>
                            <ProjectListPage />
                          </PageTransition>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Project route */}
                  <Route
                    path="/projects/:projectId"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <PageTransition>
                            <MainLayout />
                          </PageTransition>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* AI Test Page */}
                  <Route
                    path="/ai-test"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <PageTransition>
                            <AITestPage />
                          </PageTransition>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Bug Report Page */}
                  <Route
                    path="/report-bug"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <PageTransition>
                            <ReportBug />
                          </PageTransition>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Debug Routes (only in development) */}
                  <Route
                    path="/debug-files"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <PageTransition>
                            <DebugFilesPage />
                          </PageTransition>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Redirects */}
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/projects" element={<Navigate to="/" replace />} />
                  
                  {/* 404 Not Found - must be last */}
                  <Route 
                    path="*" 
                    element={
                      <PageTransition>
                        <NotFound />
                      </PageTransition>
                    } 
                  />
                </Routes>
                
                {/* Global error alert */}
                <Snackbar
                  open={!!globalError}
                  autoHideDuration={6000}
                  onClose={handleCloseError}
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                  {globalError && (
                    <Alert 
                      onClose={handleCloseError}
                      severity="error"
                      variant="filled"
                      sx={{ 
                        width: '100%', 
                        boxShadow: 3,
                        '& .MuiAlert-message': { fontWeight: 500 }
                      }}
                    >
                      {globalError.getUserMessage()}
                    </Alert>
                  )}
                </Snackbar>
                
                {/* Add FileUploadStatus here, which will appear on all pages when necessary */}
                <FileUploadStatus />
              </AuthProvider>
            </LocalizationProvider>
          </NotificationProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;

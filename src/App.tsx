import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { lightTheme, darkTheme } from './theme/index';
import { AuthProvider } from './contexts/AuthContext';
import NotificationProvider from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import useAppStore from './store';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import NotFound from './pages/NotFound';
import AITestPage from './pages/AITestPage';

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

function App() {
  const themeMode = useAppStore((state) => state.themeMode);
  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyle />
        <NotificationProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Router>
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
              </AuthProvider>
            </Router>
          </LocalizationProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

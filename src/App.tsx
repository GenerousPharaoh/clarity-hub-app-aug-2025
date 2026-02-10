import * as React from 'react';
import { CssBaseline } from '@mui/material';
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
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  

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
        
        <ErrorBoundary>
          <NotificationProvider>
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

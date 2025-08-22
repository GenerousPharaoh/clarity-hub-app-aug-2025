import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Stack, 
  Collapse, 
  IconButton, 
  Alert, 
  Divider,
  Chip,
  styled,
  CircularProgress,
  Container
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  ExpandMore, 
  ExpandLess, 
  BugReport,
  Home,
  ArrowBack,
  ErrorOutline
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  routeOnReset?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  isRetrying: boolean;
  retryCount: number;
}

// Component to provide navigation functionality within class component
export const ErrorBoundaryWithNavigation = (props: Props) => {
  // Always use the fallback approach to avoid router context issues
  return (
    <ErrorBoundaryClass 
      {...props} 
      navigate={(path) => { 
        console.log('Navigation attempted:', path);
        // Use direct location change to avoid router context dependencies
        if (typeof path === 'string') {
          window.location.href = path;
        }
      }} 
      location={{pathname: window.location.pathname}} 
    />
  );
};

// Error code extraction helper
const getErrorCode = (error: Error): string => {
  const errorText = error.toString();
  const codeMatch = errorText.match(/\[(.*?)\]/);
  return codeMatch ? codeMatch[1] : 'UNKNOWN';
};

// Styled animation for the error icon
const AnimatedErrorIcon = styled(ErrorOutline)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.error.main,
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      opacity: 0.6,
      transform: 'scale(0.95)',
    },
    '50%': {
      opacity: 1,
      transform: 'scale(1.05)',
    },
    '100%': {
      opacity: 0.6,
      transform: 'scale(0.95)',
    },
  },
}));

/**
 * Enhanced Error Boundary component with better error reporting and recovery options
 */
class ErrorBoundaryClass extends Component<Props & { navigate: Function, location: any }, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    isRetrying: false,
    retryCount: 0
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Here you would typically send to an error reporting service
    // For example: errorReportingService.captureException(error, { extra: errorInfo });
  }
  
  // Reset error state on prop changes if configured
  componentDidUpdate(prevProps: Props): void {
    if (
      this.props.resetOnPropsChange && 
      this.state.hasError && 
      prevProps.children !== this.props.children
    ) {
      this.handleReset();
    }
  }

  toggleDetails = (): void => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  };

  handleReset = async (): Promise<void> => {
    // Set retrying state to show loading
    this.setState({ isRetrying: true, retryCount: this.state.retryCount + 1 });
    
    // Simulate a delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (this.props.routeOnReset) {
      // Navigate to specified route on reset
      this.props.navigate(this.props.routeOnReset);
    }
    
    // Reset the error state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      isRetrying: false 
    });
  };
  
  handleNavigateHome = (): void => {
    this.props.navigate('/');
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };
  
  handleNavigateBack = (): void => {
    this.props.navigate(-1);
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };
  
  // Try to determine a contextual recovery action based on the error
  getContextualAction = (): { text: string; action: () => void } | null => {
    const { error } = this.state;
    const { location } = this.props;
    
    if (!error) return null;
    
    const errorMessage = error.toString().toLowerCase();
    
    // File or resource not found errors
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return {
        text: 'Go to Dashboard',
        action: this.handleNavigateHome
      };
    }
    
    // Authentication related errors
    if (
      errorMessage.includes('unauthorized') || 
      errorMessage.includes('authentication') || 
      errorMessage.includes('permission') ||
      errorMessage.includes('access denied') ||
      errorMessage.includes('token')
    ) {
      return {
        text: 'Go to Login',
        action: () => this.props.navigate('/login')
      };
    }
    
    // Network errors
    if (
      errorMessage.includes('network') || 
      errorMessage.includes('connection') ||
      errorMessage.includes('offline')
    ) {
      return {
        text: 'Check Connection & Retry',
        action: this.handleReset
      };
    }
    
    // If on a specific page with ID that might be causing issues
    if (location.pathname.includes('/projects/')) {
      return {
        text: 'Go to Projects List',
        action: () => this.props.navigate('/')
      };
    }
    
    return null;
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showDetails, isRetrying } = this.state;
    
    if (hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const contextualAction = this.getContextualAction();
      const errorCode = error ? getErrorCode(error) : 'UNKNOWN';

      // Otherwise use the enhanced error UI
      return (
        <Container maxWidth="md" sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 5, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            <BugReport color="error" sx={{ fontSize: 60, mb: 2, opacity: 0.8 }} />
            <Typography variant="h4" component="h1" gutterBottom color="error.main">
              Something went wrong
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              An error occurred in the application. Please try refreshing the page or contact support if the problem persists.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && error && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'grey.900', 
                color: 'grey.100', 
                width: '100%',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflowX: 'auto'
              }}>
                <Typography variant="subtitle2" color="error.light" sx={{ mb: 1 }}>
                  Error: {error.toString()}
                </Typography>
                {errorInfo && (
                  <pre style={{ whiteSpace: 'pre-wrap' }}>
                    {errorInfo.componentStack}
                  </pre>
                )}
              </Box>
            )}
            
            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={this.handleReset}
                startIcon={<RefreshIcon />}
              >
                Try Again
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundaryWithNavigation; 
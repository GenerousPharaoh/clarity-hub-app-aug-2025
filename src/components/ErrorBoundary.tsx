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
  CircularProgress
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
  // Prevent error during initial render by handling case where navigate is not available
  try {
    const navigate = useNavigate();
    const location = useLocation();
    
    return <ErrorBoundaryClass {...props} navigate={navigate} location={location} />;
  } catch (error) {
    console.error('Error rendering ErrorBoundaryWithNavigation:', error);
    
    // Provide a fallback component that doesn't require router context
    return (
      <ErrorBoundaryClass 
        {...props} 
        navigate={(path) => { 
          console.log('Navigation attempted but not available:', path);
          // Fallback to direct location change if we're not in a router context
          if (typeof path === 'string') {
            window.location.href = path;
          }
        }} 
        location={{pathname: window.location.pathname}} 
      />
    );
  }
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
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 3,
            backgroundImage: theme => 
              theme.palette.mode === 'dark' 
                ? 'radial-gradient(circle at 50% 14%, rgba(96, 165, 250, 0.03) 0%, rgba(0, 0, 0, 0) 60%), linear-gradient(to bottom, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.4) 100%)'
                : 'radial-gradient(circle at 50% 14%, rgba(29, 78, 216, 0.02) 0%, rgba(0, 0, 0, 0) 60%), linear-gradient(to bottom, rgba(249, 250, 251, 0.9) 0%, rgba(243, 244, 246, 0.4) 100%)',
          }}
        >
          <Paper 
            elevation={3}
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              textAlign: 'center',
              borderRadius: 2,
              overflow: 'hidden',
              border: theme => `1px solid ${theme.palette.divider}`,
              boxShadow: theme => theme.palette.mode === 'dark' 
                ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <AnimatedErrorIcon />
            </Box>
            
            <Typography variant="h5" color="error" gutterBottom>
              Something went wrong
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 1 }}>
              We're sorry, but an error occurred while rendering this component.
            </Typography>
            
            <Chip 
              label={`Error Code: ${errorCode}`} 
              color="error" 
              variant="outlined"
              size="small"
              sx={{ mb: 3 }}
            />
            
            {/* Contextual error message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  {error.toString().replace(/^Error: /, '')}
                </Typography>
              </Alert>
            )}
            
            {/* Error details (expandable) */}
            {process.env.NODE_ENV !== 'production' && error && (
              <>
                <Button 
                  variant="text" 
                  size="small"
                  onClick={this.toggleDetails}
                  endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                  sx={{ mb: 2 }}
                >
                  {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
                </Button>
                
                <Collapse in={showDetails}>
                  <Box 
                    sx={{ 
                      mt: 1, 
                      p: 2, 
                      backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', 
                      borderRadius: 1,
                      textAlign: 'left',
                      overflow: 'auto',
                      maxHeight: 300,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      mb: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Error details:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ color: 'error.main' }}>
                      {error.toString()}
                    </Typography>
                    
                    {errorInfo && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Component stack:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          component="pre" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: 12,
                            color: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                          }}
                        >
                          {errorInfo.componentStack}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </>
            )}
            
            <Divider sx={{ my: 3 }}>
              <Chip label="Recovery Options" size="small" />
            </Divider>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
            >
              <Button 
                variant="contained" 
                startIcon={isRetrying ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={this.handleReset}
                disabled={isRetrying}
                color="primary"
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
              
              <Button 
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={this.handleNavigateBack}
                disabled={isRetrying}
              >
                Go Back
              </Button>
              
              <Button 
                variant="outlined"
                startIcon={<Home />}
                onClick={this.handleNavigateHome}
                disabled={isRetrying}
              >
                Go to Home
              </Button>
              
              {/* Contextual action based on error */}
              {contextualAction && (
                <Button 
                  variant="outlined"
                  color="secondary"
                  onClick={contextualAction.action}
                  disabled={isRetrying}
                >
                  {contextualAction.text}
                </Button>
              )}
            </Stack>
            
            {/* Bug report link - in production this would go to your support system */}
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                component={Link}
                to="/report-bug"
                size="small"
                color="inherit"
                startIcon={<BugReport fontSize="small" />}
                sx={{ fontSize: '0.75rem' }}
              >
                Report this bug
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundaryWithNavigation; 
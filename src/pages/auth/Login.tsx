import * as React from 'react';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle, user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      // signInWithOAuth redirects the browser, so if we're still here
      // after a delay, something went wrong
      setTimeout(() => {
        setLoading(false);
        setError('Sign-in redirect did not complete. Please try again.');
      }, 10000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Logo mark */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          boxShadow: '0 4px 14px rgba(30, 58, 95, 0.25)',
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          CH
        </Typography>
      </Box>

      <Typography
        component="h1"
        sx={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'text.primary',
          letterSpacing: '-0.025em',
          mb: 0.75,
        }}
      >
        Clarity Hub
      </Typography>

      <Typography
        sx={{
          fontSize: '0.875rem',
          color: 'text.secondary',
          mb: 4,
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}
      >
        Organize evidence. Build arguments. Win cases.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            width: '100%',
            borderRadius: '10px',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </Alert>
      )}

      <Button
        fullWidth
        variant="contained"
        onClick={handleGoogleSignIn}
        disabled={loading}
        startIcon={
          loading ? (
            <CircularProgress size={18} sx={{ color: 'inherit' }} />
          ) : (
            <GoogleIcon sx={{ fontSize: '1.125rem' }} />
          )
        }
        sx={{
          py: 1.4,
          px: 3,
          borderRadius: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.01em',
          backgroundColor: '#1e3a5f',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(30, 58, 95, 0.3)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#2d5a87',
            boxShadow: '0 4px 16px rgba(30, 58, 95, 0.35)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&.Mui-disabled': {
            backgroundColor: '#1e3a5f',
            color: 'rgba(255,255,255,0.7)',
          },
        }}
      >
        {loading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      <Typography
        sx={{
          fontSize: '0.7rem',
          color: 'text.disabled',
          mt: 3,
          letterSpacing: '0.02em',
        }}
      >
        Secure authentication powered by Google
      </Typography>
    </Box>
  );
}

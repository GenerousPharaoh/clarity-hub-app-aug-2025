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
        py: 2,
      }}
    >
      <Typography
        component="h1"
        variant="h4"
        sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}
      >
        Clarity Hub
      </Typography>

      <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
        Organize evidence. Build arguments. Win cases.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
          {error}
        </Alert>
      )}

      <Button
        fullWidth
        variant="outlined"
        onClick={handleGoogleSignIn}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
        sx={{
          py: 1.5,
          borderColor: 'divider',
          color: 'text.primary',
          fontSize: '0.95rem',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: 'text.secondary',
          },
        }}
      >
        {loading ? 'Redirecting...' : 'Sign in with Google'}
      </Button>
    </Box>
  );
}

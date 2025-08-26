import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
import { supabase } from '../../services/supabaseClient';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          // Exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('OAuth callback error:', error);
            setError(error.message);
            setTimeout(() => navigate('/auth/login'), 3000);
          } else {
            // Success - redirect to dashboard
            navigate('/');
          }
        } else {
          // Check for error in URL
          const error = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');
          
          if (error) {
            console.error('OAuth error:', error, errorDescription);
            setError(errorDescription || error);
            setTimeout(() => navigate('/auth/login'), 3000);
          } else {
            // No code or error - redirect to login
            navigate('/auth/login');
          }
        }
      } catch (err) {
        console.error('Unexpected error in OAuth callback:', err);
        setError('An unexpected error occurred');
        setTimeout(() => navigate('/auth/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3
      }}
    >
      {error ? (
        <>
          <Typography variant="h6" color="error" gutterBottom>
            Authentication Error
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Redirecting to login...
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Completing sign in...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we authenticate your account
          </Typography>
        </>
      )}
    </Box>
  );
}
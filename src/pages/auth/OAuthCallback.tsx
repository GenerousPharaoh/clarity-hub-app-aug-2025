import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
import { supabase } from '../../lib/supabase';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        if (errorParam) {
          setError(errorDescription || errorParam);
          setTimeout(() => navigate('/auth/login'), 3000);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setError(error.message);
            setTimeout(() => navigate('/auth/login'), 3000);
          } else {
            navigate('/');
          }
        } else {
          navigate('/auth/login');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
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
        p: 3,
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
        </>
      )}
    </Box>
  );
}

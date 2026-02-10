import * as React from 'react';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { supabase } from '../../lib/supabase';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [timedOut, setTimedOut] = React.useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Timeout: if nothing happens in 15s, show a retry option
    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, 15000);

    const handleCallback = async () => {
      try {
        // Check query params first (PKCE flow)
        const queryParams = new URLSearchParams(window.location.search);
        // Also check hash fragments (implicit flow fallback)
        const hashParams = new URLSearchParams(
          window.location.hash.startsWith('#')
            ? window.location.hash.substring(1)
            : ''
        );

        const errorParam = queryParams.get('error') || hashParams.get('error');
        const errorDescription =
          queryParams.get('error_description') || hashParams.get('error_description');

        if (errorParam) {
          clearTimeout(timeout);
          setError(errorDescription || errorParam);
          setTimeout(() => navigate('/auth/login'), 3000);
          return;
        }

        // PKCE flow: code in query params
        const code = queryParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          clearTimeout(timeout);
          if (exchangeError) {
            // If code already used, check if we have a session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              navigate('/', { replace: true });
              return;
            }
            setError(exchangeError.message);
            setTimeout(() => navigate('/auth/login'), 3000);
          } else {
            navigate('/', { replace: true });
          }
          return;
        }

        // Implicit flow: access_token in hash
        const accessToken = hashParams.get('access_token');
        if (accessToken) {
          // The Supabase client should auto-detect this via onAuthStateChange
          clearTimeout(timeout);
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            navigate('/', { replace: true });
          } else {
            // Wait briefly for onAuthStateChange to fire
            setTimeout(async () => {
              const { data: { session: s } } = await supabase.auth.getSession();
              if (s) {
                navigate('/', { replace: true });
              } else {
                setError('Failed to establish session');
                setTimeout(() => navigate('/auth/login'), 3000);
              }
            }, 2000);
          }
          return;
        }

        // No code or token - check if already authenticated
        clearTimeout(timeout);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/', { replace: true });
        } else {
          navigate('/auth/login', { replace: true });
        }
      } catch (err: any) {
        clearTimeout(timeout);
        console.error('OAuth callback error:', err);
        setError(err?.message || 'An unexpected error occurred');
        setTimeout(() => navigate('/auth/login'), 3000);
      }
    };

    handleCallback();

    return () => clearTimeout(timeout);
  }, [navigate]);

  const handleRetry = () => {
    navigate('/auth/login', { replace: true });
  };

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
      ) : timedOut ? (
        <>
          <Typography variant="h6" gutterBottom>
            Taking longer than expected
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The sign-in process seems to be stuck.
          </Typography>
          <Button variant="contained" onClick={handleRetry} sx={{ textTransform: 'none' }}>
            Back to Login
          </Button>
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

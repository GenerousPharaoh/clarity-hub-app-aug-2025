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
        // Check for hash fragment (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        // Check for code parameter (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (accessToken) {
          // Implicit flow - session is already established
          console.log('OAuth implicit flow detected');
          // The session should already be set by Supabase
          // Just redirect to dashboard
          setTimeout(() => {
            navigate('/');
          }, 100);
        } else if (code) {
          // PKCE flow - exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('OAuth callback error:', error);
            setError(error.message);
            setTimeout(() => navigate('/auth/login'), 3000);
          } else {
            console.log('OAuth PKCE success, session:', data.session);
            // Wait a bit for auth state to propagate
            setTimeout(() => {
              // Success - redirect to dashboard
              navigate('/');
            }, 100);
          }
        } else {
          // Check for error in URL
          const error = urlParams.get('error') || hashParams.get('error');
          const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
          
          if (error) {
            console.error('OAuth error:', error, errorDescription);
            setError(errorDescription || error);
            setTimeout(() => navigate('/auth/login'), 3000);
          } else {
            // No token, code, or error - redirect to login
            console.log('No OAuth data found in callback');
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
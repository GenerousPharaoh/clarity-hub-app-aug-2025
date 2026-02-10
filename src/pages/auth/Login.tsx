import * as React from 'react';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/* Inline Google "G" logo — proper brand colours */
function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

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
      }}
    >
      {/* Mobile-only logo (hidden on md+ where left panel shows) */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          gap: 1.5,
          mb: 4,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{ color: '#fff', fontSize: '0.875rem', fontWeight: 700, lineHeight: 1 }}
          >
            CH
          </Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
          Clarity Hub
        </Typography>
      </Box>

      <Typography
        component="h1"
        sx={{
          fontSize: '1.625rem',
          fontWeight: 700,
          color: '#0f172a',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        }}
      >
        Sign in
      </Typography>

      <Typography
        sx={{
          fontSize: '0.875rem',
          color: '#64748b',
          mt: 1,
          mb: 4,
          fontWeight: 400,
          lineHeight: 1.5,
        }}
      >
        Continue to your workspace
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            width: '100%',
            borderRadius: '10px',
            fontSize: '0.8125rem',
            border: '1px solid',
            borderColor: 'error.light',
          }}
        >
          {error}
        </Alert>
      )}

      <Button
        fullWidth
        variant="outlined"
        onClick={handleGoogleSignIn}
        disabled={loading}
        startIcon={
          loading ? (
            <CircularProgress size={18} sx={{ color: '#64748b' }} />
          ) : (
            <GoogleLogo size={18} />
          )
        }
        sx={{
          py: 1.4,
          px: 3,
          borderRadius: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.005em',
          color: '#1e293b',
          borderColor: '#e2e8f0',
          borderWidth: '1.5px',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 150ms ease',
          '&:hover': {
            borderColor: '#cbd5e1',
            backgroundColor: '#f8fafc',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          },
          '&:active': {
            backgroundColor: '#f1f5f9',
            boxShadow: 'none',
          },
          '&.Mui-disabled': {
            borderColor: '#e2e8f0',
            color: '#94a3b8',
            opacity: 0.8,
          },
        }}
      >
        {loading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      {/* Divider */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mt: 4,
          mb: 3,
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        <Typography sx={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Secure login
        </Typography>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
      </Box>

      {/* Trust indicators */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {[
          { label: 'Enterprise-grade encryption', icon: lockIcon },
          { label: 'SOC 2 compliant infrastructure', icon: shieldIcon },
          { label: 'Your data stays yours', icon: userIcon },
        ].map(({ label, icon }) => (
          <Box
            key={label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#94a3b8',
              }}
              dangerouslySetInnerHTML={{ __html: icon }}
            />
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: '#64748b',
                fontWeight: 400,
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* Tiny inline SVG icons — avoids extra MUI icon imports */
const lockIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const shieldIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
const userIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, CircularProgress } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [redirecting, setRedirecting] = useState(false);

  // Auto-redirect after 5 seconds
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setRedirecting(true);
      const redirectTimer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
      return () => clearTimeout(redirectTimer);
    }
  }, [countdown, navigate]);

  return (
    <Container>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Typography 
          variant="h1" 
          sx={{ 
            mb: 2, 
            fontSize: { xs: '5rem', sm: '8rem' },
            background: 'linear-gradient(45deg, #2C4F7C 10%, #3A5E86 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
          }}
        >
          404
        </Typography>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 500 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '500px' }}>
          The page you're looking for doesn't exist or has been moved.
          {!redirecting && (
            <Box component="span" sx={{ display: 'block', mt: 2, fontWeight: 'bold' }}>
              Redirecting to homepage in {countdown} seconds...
            </Box>
          )}
        </Typography>
        
        {redirecting ? (
          <CircularProgress size={36} sx={{ mb: 2 }} />
        ) : (
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            startIcon={<HomeIcon />}
            sx={{
              boxShadow: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(45deg, #2C4F7C 30%, #3A5E86 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #3A5E86 30%, #4E6D94 90%)',
              },
            }}
          >
            Back to Home
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default NotFound; 
import * as React from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  CircularProgress,
  Alert,
  Stack 
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmPasswordReset } = useAuth();
  
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  
  // Get code from URL query params
  const queryParams = new URLSearchParams(location.search);
  const code = queryParams.get('code');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!code) {
      setError('Invalid password reset link');
      return;
    }
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await confirmPasswordReset(code, password);
      setSuccess(true);
      
      // Navigate back to login after a delay
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          Your password has been successfully reset
        </Alert>
        <Typography variant="body2">
          You will be redirected to the login page shortly.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography 
        component="h1" 
        variant="h4" 
        align="center" 
        sx={{ 
          mb: 3, 
          fontWeight: 700,
          background: theme => theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, #60A5FA, #A78BFA)'
            : 'linear-gradient(90deg, #1D4ED8, #7C3AED)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Create New Password
      </Typography>
      
      {!code && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Invalid or expired password reset link. Please request a new one.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Stack spacing={3}>
        <TextField
          label="New Password"
          type="password"
          required
          fullWidth
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!code || loading}
        />
        
        <TextField
          label="Confirm New Password"
          type="password"
          required
          fullWidth
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={!code || loading}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={!code || loading}
          sx={{ py: 1.2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Reset Password'}
        </Button>
      </Stack>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Typography
          component={RouterLink}
          to="/auth/login"
          variant="body2"
          sx={{ 
            textDecoration: 'none',
            color: 'primary.main',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          Back to Sign In
        </Typography>
      </Box>
    </Box>
  );
} 
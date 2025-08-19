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
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    try {
      await resetPassword(email);
      setMessage('Password reset link sent to your email');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };
  
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
        Reset Password
      </Typography>
      
      <Typography variant="body2" align="center" sx={{ mb: 3 }}>
        Enter your email address and we'll send you a link to reset your password.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      
      <Stack spacing={3}>
        <TextField
          label="Email Address"
          type="email"
          required
          fullWidth
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
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
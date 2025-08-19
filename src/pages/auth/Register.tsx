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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
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
      await signUp(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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
        Create Account
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
        
        <TextField
          label="Password"
          type="password"
          required
          fullWidth
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <TextField
          label="Confirm Password"
          type="password"
          required
          fullWidth
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ py: 1.2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign Up'}
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
          Already have an account? Sign In
        </Typography>
      </Box>
    </Box>
  );
} 
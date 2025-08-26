import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, Paper } from '@mui/material';

// Import auth pages
const Login = React.lazy(() => import('./Login'));
const Register = React.lazy(() => import('./Register'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword'));
const ResetPassword = React.lazy(() => import('./ResetPassword'));
const OAuthCallback = React.lazy(() => import('./OAuthCallback'));

export default function Auth() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: theme => theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle at 50% 14%, rgba(96, 165, 250, 0.03) 0%, rgba(0, 0, 0, 0) 60%), linear-gradient(to bottom, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.4) 100%)'
          : 'radial-gradient(circle at 50% 14%, rgba(29, 78, 216, 0.02) 0%, rgba(0, 0, 0, 0) 60%), linear-gradient(to bottom, rgba(249, 250, 251, 0.9) 0%, rgba(243, 244, 246, 0.4) 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            boxShadow: theme => theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
              : '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}
        >
          <React.Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="callback" element={<OAuthCallback />} />
              <Route path="*" element={<Navigate to="login" replace />} />
            </Routes>
          </React.Suspense>
        </Paper>
      </Container>
    </Box>
  );
} 
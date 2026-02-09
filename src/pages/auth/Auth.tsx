import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

const Login = React.lazy(() => import('./Login'));
const OAuthCallback = React.lazy(() => import('./OAuthCallback'));

export default function Auth() {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #f8f9fb 0%, #eef1f5 50%, #e8ecf1 100%)',
      }}
    >
      {/* Subtle decorative elements */}
      <Box
        sx={{
          position: 'fixed',
          top: -120,
          right: -120,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,58,95,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: -80,
          left: -80,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,58,95,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          width: '100%',
          maxWidth: 380,
          mx: 2,
          p: { xs: 3.5, sm: 4.5 },
          borderRadius: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <React.Suspense
          fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  border: '3px solid #e8ecf1',
                  borderTopColor: '#1e3a5f',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  '@keyframes spin': {
                    to: { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </Box>
          }
        >
          <Routes>
            <Route path="login" element={<Login />} />
            <Route path="callback" element={<OAuthCallback />} />
            <Route path="*" element={<Navigate to="login" replace />} />
          </Routes>
        </React.Suspense>
      </Box>
    </Box>
  );
}

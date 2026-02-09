import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, Paper } from '@mui/material';

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
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <React.Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="callback" element={<OAuthCallback />} />
              <Route path="*" element={<Navigate to="login" replace />} />
            </Routes>
          </React.Suspense>
        </Paper>
      </Container>
    </Box>
  );
}

import * as React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

// Lazy-loaded components
const MainLayout = React.lazy(() => import('../layouts/MainLayout'));
const Auth = React.lazy(() => import('../pages/auth/Auth'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const ProjectView = React.lazy(() => import('../pages/ProjectView'));
const ProjectLayout = React.lazy(() => import('../layouts/ProjectLayout'));
const Settings = React.lazy(() => import('../pages/Settings'));
const Messages = React.lazy(() => import('../pages/Messages'));
const Help = React.lazy(() => import('../pages/Help'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

function LoadingScreen() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <CircularProgress size={48} />
    </Box>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Save the attempted location for redirecting after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  const { loading } = useAuth();

  // Show loading screen while auth is initializing
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Auth routes - no protection needed */}
        <Route path="/auth/*" element={<Auth />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="profile" element={<Settings />} />
        </Route>
        
        {/* Protected project routes with specialized layout */}
        <Route path="/projects/:projectId/*" element={
          <PrivateRoute>
            <ProjectLayout />
          </PrivateRoute>
        }>
          <Route index element={<ProjectView />} />
        </Route>
        
        {/* Fallback routes */}
        <Route path="/not-found" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </React.Suspense>
  );
}
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './components/auth/LoginPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LoadingScreen } from './components/shared/LoadingScreen';
import useAppStore from './store';

// Lazy-loaded page components for code splitting
const DashboardPage = lazy(() =>
  import('./components/dashboard/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  }))
);
const WorkspacePage = lazy(() =>
  import('./components/workspace/WorkspacePage').then((m) => ({
    default: m.WorkspacePage,
  }))
);
const SettingsPage = lazy(() =>
  import('./components/settings/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  }))
);

function useResolvedTheme() {
  const themeMode = useAppStore((s) => s.themeMode);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => {
    if (themeMode !== 'system') return themeMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    if (themeMode !== 'system') {
      setResolved(themeMode);
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) =>
      setResolved(e.matches ? 'dark' : 'light');

    setResolved(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  return resolved;
}

export default function App() {
  const resolved = useResolvedTheme();

  // Toggle dark class on <html> for Tailwind dark mode to work globally
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/project/:projectId" element={<WorkspacePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>

      <Toaster
        position="bottom-right"
        theme={resolved}
        toastOptions={{
          className: 'font-body',
          style: {
            borderRadius: '8px',
          },
        }}
      />
    </ErrorBoundary>
  );
}

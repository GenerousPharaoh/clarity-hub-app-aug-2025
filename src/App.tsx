import { lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './components/auth/LoginPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { PrivacyPage } from './components/legal/PrivacyPage';
import { TermsPage } from './components/legal/TermsPage';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import useAppStore from './store';

/**
 * Lazy import with auto-reload on chunk load failure.
 * After a new deployment, cached HTML may reference old chunk hashes.
 * On failure, reload the page once to pick up the new HTML + chunks.
 */
function lazyWithReload<T extends React.ComponentType>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch(() => {
      const reloaded = sessionStorage.getItem('chunk-reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk-reload', '1');
        window.location.reload();
      }
      // If already reloaded once, surface the error
      return factory();
    })
  );
}

// Clear the reload flag on successful page load
if (typeof window !== 'undefined') {
  sessionStorage.removeItem('chunk-reload');
}

// Lazy-loaded page components for code splitting
const DashboardPage = lazyWithReload(() =>
  import('./components/dashboard/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  }))
);
const WorkspacePage = lazyWithReload(() =>
  import('./components/workspace/WorkspacePage').then((m) => ({
    default: m.WorkspacePage,
  }))
);
const SettingsPage = lazyWithReload(() =>
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
  const displayDensity = useAppStore((s) => s.displayDensity);

  // Toggle dark class on <html> for Tailwind dark mode to work globally
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);

  // Apply density class on <html> for CSS custom properties
  useEffect(() => {
    document.documentElement.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    document.documentElement.classList.add(`density-${displayDensity}`);
  }, [displayDensity]);

  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/project/:projectId" element={<WorkspacePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>

      <Toaster
        position="bottom-right"
        theme={resolved}
        gap={8}
        toastOptions={{
          className: 'font-body',
          style: {
            borderRadius: '8px',
          },
        }}
        offset={{ bottom: 16, right: 16 }}
        mobileOffset={{ bottom: 72 }}
      />
    </ErrorBoundary>
  );
}

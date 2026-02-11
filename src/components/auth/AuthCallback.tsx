import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { cn } from '@/lib/utils';

const CALLBACK_TIMEOUT_MS = 15_000;

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for error params (OAuth errors come as query/hash params)
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const urlError = params.get('error') || hashParams.get('error');
    const errorDesc = params.get('error_description') || hashParams.get('error_description');

    if (urlError) {
      setError(errorDesc || urlError);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true });
      }
    });

    // Timeout — if callback doesn't complete, show error
    const timeout = setTimeout(() => {
      setError('Sign-in is taking too long. Please try again.');
    }, CALLBACK_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-6 dark:bg-surface-950">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H1.752c1.73 0 2.813-1.874 1.948-3.374L10.051 4.328c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold text-surface-900 dark:text-surface-100">
            Sign-in failed
          </h2>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            {error}
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className={cn(
              'mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5',
              'bg-primary-600 text-sm font-medium text-white',
              'transition-all hover:bg-primary-500',
            )}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <LoadingScreen message="Completing sign-in..." />;
}

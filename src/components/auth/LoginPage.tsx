import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { Scale } from 'lucide-react';

export function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary-800 p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Scale className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-semibold">Clarity Hub</span>
          </div>

          <h1 className="font-heading text-4xl font-bold leading-tight mb-4">
            Organize evidence.
            <br />
            Build stronger arguments.
          </h1>
          <p className="text-lg text-primary-200 max-w-md">
            A professional workspace for managing legal documents,
            analyzing evidence, and preparing case strategy with AI assistance.
          </p>
        </div>

        <p className="text-sm text-primary-300">
          Powered by advanced AI reasoning
        </p>
      </div>

      {/* Right: Login */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-surface-900">
              Clarity Hub
            </span>
          </div>

          <h2 className="font-heading text-2xl font-semibold text-surface-900 mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-surface-500 mb-8">
            Sign in to access your workspace
          </p>

          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm font-medium text-surface-700 shadow-sm transition-all hover:bg-surface-50 hover:shadow-md"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}

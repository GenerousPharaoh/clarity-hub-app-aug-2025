import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { Scale, AlertCircle, PlayCircle, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const { user, loading, signInWithGoogle, enterDemoMode } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [enteringDemo, setEnteringDemo] = useState(false);

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      setSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Sign-in failed. Please try again or check your browser popup settings.'
      );
      setSigningIn(false);
    }
  };

  const handleEnterDemo = async () => {
    try {
      setAuthError(null);
      setEnteringDemo(true);
      await enterDemoMode();
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Could not start demo mode. Please refresh and try again.'
      );
      setEnteringDemo(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-surface-950">
      {/* Left: Full-bleed dark branding */}
      <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between overflow-hidden p-16">
        {/* Layered background */}
        <div className="absolute inset-0 bg-surface-950" />
        {/* Mesh gradient */}
        <div className="absolute inset-0 opacity-60"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 10% 90%, rgba(20,184,166,0.12), transparent),
              radial-gradient(ellipse 60% 50% at 80% 20%, rgba(100,116,139,0.1), transparent)
            `,
          }}
        />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/[0.1] backdrop-blur-sm">
            <Scale className="h-5 w-5 text-white/90" />
          </div>
          <span className="font-heading text-xl font-semibold tracking-tight text-white">Clarity Hub</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-lg">
          <h1 className="font-heading text-5xl font-bold leading-[1.1] tracking-tight text-white xl:text-6xl">
            Evidence.
            <br />
            <span className="text-accent-400">Analysis.</span>
            <br />
            Strategy.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-surface-400 max-w-md">
            The legal case management platform that turns document chaos into courtroom clarity.
          </p>

          {/* Stats */}
          <div className="mt-10 flex gap-10">
            <div>
              <p className="font-heading text-3xl font-bold text-white">AI</p>
              <p className="mt-1 text-sm text-surface-500">Powered analysis</p>
            </div>
            <div className="h-12 w-px bg-surface-800" />
            <div>
              <p className="font-heading text-3xl font-bold text-white">PDF</p>
              <p className="mt-1 text-sm text-surface-500">Annotation</p>
            </div>
            <div className="h-12 w-px bg-surface-800" />
            <div>
              <p className="font-heading text-3xl font-bold text-white">ON</p>
              <p className="mt-1 text-sm text-surface-500">Ontario law</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-sm text-surface-600">
          Built for legal professionals
        </p>
      </div>

      {/* Right: Login form — clean, spacious */}
      <div className="relative flex flex-1 items-center justify-center bg-white p-8 dark:bg-surface-900 lg:p-16">
        {/* Subtle corner accent */}
        <div className="pointer-events-none absolute right-0 top-0 h-[300px] w-[300px] rounded-bl-full bg-accent-50/40 dark:bg-accent-950/10" />

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-950 dark:bg-white">
              <Scale className="h-6 w-6 text-white dark:text-surface-950" />
            </div>
            <span className="font-heading text-2xl font-bold text-surface-900 dark:text-surface-100">
              Clarity Hub
            </span>
          </div>

          <h2 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-100 sm:text-4xl">
            Sign in
          </h2>
          <p className="mt-3 text-base text-surface-500 dark:text-surface-400">
            Access your legal workspace
          </p>

          {authError && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/50 dark:bg-red-950/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">{authError}</p>
            </div>
          )}

          <div className="mt-10 space-y-4">
            <button
              onClick={handleSignIn}
              disabled={signingIn || enteringDemo}
              className={cn(
                'group flex w-full items-center justify-center gap-3 rounded-2xl',
                'bg-surface-950 px-6 py-5',
                'text-base font-semibold text-white',
                'shadow-lg shadow-surface-950/10 transition-all duration-200',
                'hover:shadow-xl hover:shadow-surface-950/20 hover:-translate-y-0.5',
                'active:scale-[0.98] active:shadow-md',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'dark:bg-white dark:text-surface-950 dark:shadow-white/5',
                'dark:hover:shadow-white/10'
              )}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
              <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </button>

            <button
              onClick={handleEnterDemo}
              disabled={signingIn || enteringDemo}
              className={cn(
                'flex w-full items-center justify-center gap-3 rounded-2xl',
                'border-2 border-surface-200 px-6 py-4',
                'text-base font-medium text-surface-600',
                'transition-all duration-200',
                'hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50/50',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'dark:border-surface-700 dark:text-surface-300',
                'dark:hover:border-primary-600 dark:hover:text-primary-300 dark:hover:bg-primary-950/20'
              )}
            >
              {enteringDemo ? (
                <>
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" className="opacity-20" stroke="currentColor" strokeWidth="3" />
                    <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5" />
                  Explore Demo
                </>
              )}
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-surface-200 bg-surface-50/80 p-5 dark:border-surface-800 dark:bg-surface-800/40">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-400 dark:text-surface-500">
              What you get
            </p>
            <div className="mt-4 space-y-3">
              <DemoChecklistItem>Upload and annotate PDFs with highlights and comments</DemoChecklistItem>
              <DemoChecklistItem>AI-powered case analysis across all your documents</DemoChecklistItem>
              <DemoChecklistItem>Draft legal filings with Ontario law built in</DemoChecklistItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-500 dark:text-primary-400" />
      <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-300">{children}</p>
    </div>
  );
}

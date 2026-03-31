import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { Scale, AlertCircle, PlayCircle, CheckCircle2, ShieldCheck, FolderSearch, Sparkles } from 'lucide-react';
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
    <div className="flex min-h-screen dark:bg-surface-950">
      {/* Left: Branding — dark premium */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden p-12 text-white">
        {/* Near-black gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 0.5px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Very subtle warm glow */}
        <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-accent-500/5 blur-[150px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/[0.08]">
              <Scale className="h-4 w-4 text-white/80" />
            </div>
            <span className="font-heading text-lg font-medium tracking-tight text-white/90">Clarity Hub</span>
          </div>

          <h1 className="font-heading text-4xl font-semibold leading-[1.15] tracking-tight mb-5">
            Legal case
            <br />
            management,
            <br />
            <span className="text-surface-400">reimagined.</span>
          </h1>
          <p className="text-sm text-surface-400 max-w-sm leading-relaxed">
            Organize evidence, annotate documents, draft legal filings, and build case theory with AI-powered intelligence.
          </p>

          <div className="mt-10 space-y-3 max-w-sm">
            <FeaturePill icon={<FolderSearch className="h-4 w-4" />}>
              Evidence organization and exhibit management
            </FeaturePill>
            <FeaturePill icon={<ShieldCheck className="h-4 w-4" />}>
              AI-powered document analysis and drafting
            </FeaturePill>
            <FeaturePill icon={<Sparkles className="h-4 w-4" />}>
              Ontario legal knowledge built in
            </FeaturePill>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/20 tracking-wide">
          Built for legal professionals
        </p>
      </div>

      {/* Right: Login form */}
      <div className="flex flex-1 items-center justify-center bg-white p-8 dark:bg-surface-900">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
              Clarity Hub
            </span>
          </div>

          <h2 className="font-heading text-2xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-8">
            Sign in to access your workspace
          </p>

          {authError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800/50 dark:bg-red-950/30">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-700 dark:text-red-400">{authError}</p>
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={signingIn || enteringDemo}
            className={cn(
              'flex w-full items-center justify-center gap-3 rounded-xl',
              'border border-surface-200 bg-white px-4 py-3.5',
              'text-sm font-medium text-surface-700',
              'shadow-sm transition-all duration-200',
              'hover:bg-surface-50 hover:shadow-md hover:border-surface-300',
              'active:scale-[0.98]',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200',
              'dark:hover:bg-surface-700 dark:hover:border-surface-600 dark:hover:shadow-lg dark:hover:shadow-surface-950/30'
            )}
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

          <button
            onClick={handleEnterDemo}
            disabled={signingIn || enteringDemo}
            className={cn(
              'mt-3 flex w-full items-center justify-center gap-3 rounded-xl',
              'border border-primary-200 bg-primary-50 px-4 py-3.5',
              'text-sm font-medium text-primary-700',
              'transition-all duration-200',
              'hover:border-primary-300 hover:bg-primary-100',
              'active:scale-[0.98]',
              'disabled:cursor-not-allowed disabled:opacity-60',
              'dark:border-primary-800/60 dark:bg-primary-900/20 dark:text-primary-300',
              'dark:hover:border-primary-700 dark:hover:bg-primary-900/35'
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
                Try Demo
              </>
            )}
          </button>

          <div className="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/60">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-400 dark:text-surface-500">
              Demo Includes
            </p>
            <div className="mt-3 space-y-2">
              <DemoChecklistItem>Sample cases with notes</DemoChecklistItem>
              <DemoChecklistItem>File viewer with AI summaries</DemoChecklistItem>
              <DemoChecklistItem>Full editing capabilities</DemoChecklistItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-surface-400">
        {icon}
      </div>
      <p className="text-sm text-surface-400">{children}</p>
    </div>
  );
}

function DemoChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500 dark:text-primary-400" />
      <p className="text-xs leading-relaxed text-surface-600 dark:text-surface-300">{children}</p>
    </div>
  );
}

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { Scale, AlertCircle, PlayCircle, CheckCircle2, FileText, Brain, Bookmark } from 'lucide-react';
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
    <div className="flex min-h-screen">
      {/* Left: Dark branding panel */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col overflow-hidden bg-surface-950 p-12 xl:p-16">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-accent-500/[0.06] blur-[150px]" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-surface-700/20 blur-[100px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] ring-1 ring-white/[0.08]">
            <Scale className="h-5 w-5 text-white/80" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight text-white">Clarity Hub</span>
        </div>

        {/* Main content — vertically centered */}
        <div className="relative z-10 flex flex-1 flex-col justify-center py-16">
          <h1 className="font-heading text-[2.75rem] font-bold leading-[1.15] tracking-tight text-white xl:text-5xl">
            Legal case
            <br />
            management,
            <br />
            simplified.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-surface-300">
            Upload documents, annotate PDFs, build timelines, and draft filings with AI that understands Ontario law.
          </p>

          {/* Feature cards */}
          <div className="mt-10 grid gap-3 max-w-md">
            <FeatureCard
              icon={<FileText className="h-4 w-4" />}
              title="Document Processing"
              desc="OCR, auto-classification, and full-text search across uploads"
            />
            <FeatureCard
              icon={<Brain className="h-4 w-4" />}
              title="AI Analysis"
              desc="Ask questions across your documents with Ontario law context"
            />
            <FeatureCard
              icon={<Bookmark className="h-4 w-4" />}
              title="Exhibit Builder"
              desc="Compile exhibit books, chronologies, and filing-ready PDFs"
            />
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-surface-600">
          Clarity Hub
        </p>
      </div>

      {/* Right: Sign-in form */}
      <div className="relative flex flex-1 items-center justify-center bg-white p-8 dark:bg-surface-900 lg:p-16">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-950">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
              Clarity Hub
            </span>
          </div>

          <h2 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-100">
            Sign in
          </h2>
          <p className="mt-2 text-base text-surface-600 dark:text-surface-400">
            Access your legal workspace
          </p>

          {authError && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/50 dark:bg-red-950/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">{authError}</p>
            </div>
          )}

          <div className="mt-10 space-y-3">
            <button
              onClick={handleSignIn}
              disabled={signingIn || enteringDemo}
              className={cn(
                'flex w-full items-center justify-center gap-3 rounded-2xl',
                'bg-surface-950 px-6 py-[18px]',
                'text-[15px] font-semibold text-white',
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
            </button>

            <button
              onClick={handleEnterDemo}
              disabled={signingIn || enteringDemo}
              className={cn(
                'flex w-full items-center justify-center gap-3 rounded-2xl',
                'border-2 border-surface-200 px-6 py-[18px]',
                'text-[15px] font-medium text-surface-600',
                'transition-all duration-200',
                'hover:border-accent-400 hover:text-accent-700 hover:bg-accent-50/50',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'dark:border-surface-700 dark:text-surface-300',
                'dark:hover:border-accent-500 dark:hover:text-accent-300'
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

          <div className="mt-8 rounded-2xl border border-surface-200 bg-surface-50 p-5 dark:border-surface-800 dark:bg-surface-800/50">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-surface-500 dark:text-surface-400">
              What you get
            </p>
            <div className="mt-4 space-y-3">
              <CheckItem>PDF annotation with highlights, notes, and exhibit markers</CheckItem>
              <CheckItem>AI chat grounded in your uploaded documents</CheckItem>
              <CheckItem>Auto-generated timelines from case files</CheckItem>
              <CheckItem>Exhibit book compilation with table of contents</CheckItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group flex items-start gap-4 rounded-xl bg-white/[0.05] px-5 py-4 ring-1 ring-white/[0.08] transition-all duration-300 hover:bg-white/[0.08] hover:ring-accent-500/30">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 transition-colors group-hover:bg-accent-500/20 group-hover:text-accent-500">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-surface-400">{desc}</p>
      </div>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500 dark:text-accent-400" />
      <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300">{children}</p>
    </div>
  );
}

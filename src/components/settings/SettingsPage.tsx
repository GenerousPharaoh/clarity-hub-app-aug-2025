import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import useAppStore from '@/store';
import type { ThemeMode } from '@/store/slices/authSlice';
import { FadeIn } from '@/components/shared/FadeIn';
import {
  getProcessingUsage,
  PROCESSING_DAILY_FILE_LIMIT,
  PROCESSING_DAILY_MB_LIMIT_BYTES,
} from '@/lib/processingBudget';
import { formatFileSize } from '@/lib/utils';
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Theme option cards
// ---------------------------------------------------------------------------
const themeOptions: {
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Clean light interface',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Match OS preference',
    icon: Monitor,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string | undefined | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SettingsPage() {
  useDocumentTitle('Settings');
  const { user, signOut } = useAuth();
  const { themeMode, setTheme } = useAppStore();
  const processOnUpload = useAppStore((s) => s.processOnUpload);
  const setProcessOnUpload = useAppStore((s) => s.setProcessOnUpload);
  const storeUser = useAppStore((s) => s.user);
  const navigate = useNavigate();
  const [usage, setUsage] = useState(() => getProcessingUsage());

  const displayName =
    user?.user_metadata?.full_name ?? storeUser?.full_name ?? 'User';
  const email = user?.email ?? storeUser?.email ?? '';
  const avatarUrl =
    user?.user_metadata?.avatar_url ?? storeUser?.avatar_url ?? null;
  const createdAt = user?.created_at ?? null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const refreshUsage = () => setUsage(getProcessingUsage());

  useEffect(() => {
    const onFocus = () => refreshUsage();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <FadeIn className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      {/* ── Page title ──────────────────────────────────────── */}
      <h1 className="font-heading text-2xl font-bold text-surface-900 dark:text-surface-100">
        Settings
      </h1>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
        Manage your account and preferences
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {/* ── Profile ───────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
              Profile
            </h2>
          </div>

          <div className="flex items-center gap-5 px-6 py-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-16 w-16 shrink-0 rounded-full ring-2 ring-surface-200 dark:ring-surface-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {getInitials(displayName)}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-base font-medium text-surface-900 dark:text-surface-100">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-sm text-surface-500 dark:text-surface-400">
                {email}
              </p>
              {createdAt && (
                <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                  Member since {formatDate(createdAt)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Appearance ────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
              Appearance
            </h2>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Choose how Clarity Hub looks to you. Select a single theme or sync
              with your operating system.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {themeOptions.map((opt) => {
                const active = themeMode === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    aria-pressed={active}
                    className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-4 text-center transition-all
                      ${
                        active
                          ? 'border-primary-600 bg-primary-50 dark:border-primary-500 dark:bg-primary-950/30'
                          : 'border-surface-200 bg-surface-50 hover:border-surface-300 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800/50 dark:hover:border-surface-600 dark:hover:bg-surface-700/50'
                      }
                    `}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        active
                          ? 'bg-primary-600 text-white'
                          : 'bg-surface-200 text-surface-500 group-hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-400 dark:group-hover:bg-surface-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <p
                        className={`text-sm font-medium ${
                          active
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-tight text-surface-400 dark:text-surface-500">
                        {opt.description}
                      </p>
                    </div>

                    {/* Active indicator dot */}
                    {active && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── AI Processing ────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
              AI Processing
            </h2>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Process files automatically after upload
                </p>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  Default is off to prevent accidental API usage spikes.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={processOnUpload}
                onClick={() => setProcessOnUpload(!processOnUpload)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  processOnUpload
                    ? 'bg-primary-600'
                    : 'bg-surface-300 dark:bg-surface-600'
                }`}
                title={processOnUpload ? 'Auto processing enabled' : 'Auto processing disabled'}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    processOnUpload ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-surface-50 p-3 dark:bg-surface-800/60">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-surface-600 dark:text-surface-300">
                  Daily safety limits (local): {PROCESSING_DAILY_FILE_LIMIT} files, {Math.round(PROCESSING_DAILY_MB_LIMIT_BYTES / (1024 * 1024))}MB.
                </p>
                <button
                  onClick={refreshUsage}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-surface-500 transition-colors hover:bg-surface-200 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-200"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              </div>
              <p className="mt-1 text-[11px] text-surface-500 dark:text-surface-400">
                Today: {usage.files} file{usage.files !== 1 ? 's' : ''} processed, {formatFileSize(usage.bytes)} of data.
              </p>
            </div>
          </div>
        </section>

        {/* ── Account ───────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
              Account
            </h2>
          </div>

          <div className="flex flex-col gap-5 px-6 py-5">
            {/* Sign out */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Sign out
                </p>
                <p className="text-xs text-surface-400 dark:text-surface-500">
                  End your current session
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>

          </div>
        </section>

        {/* ── About ─────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
              About
            </h2>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                  Clarity Hub
                </p>
                <p className="text-xs text-surface-400 dark:text-surface-500">
                  Version 2.0.0
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
              Built with AI assistance. Clarity Hub helps legal professionals
              organize evidence, build arguments, and manage exhibits.
            </p>

            <div className="mt-4 rounded-lg bg-surface-50 p-3 dark:bg-surface-800/50">
              <p className="text-[11px] leading-relaxed text-surface-400 dark:text-surface-500">
                Disclaimer: The AI features in this application provide general
                information and analysis support only. They do not constitute
                legal advice, and no solicitor-client relationship is created
                through use of this tool. Always consult a qualified legal
                professional for advice on your specific situation.
              </p>
            </div>
          </div>
        </section>
      </div>
    </FadeIn>
  );
}

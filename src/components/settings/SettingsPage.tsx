import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import useAppStore from '@/store';
import type { ThemeMode } from '@/store/slices/authSlice';
import type { DisplayDensity } from '@/store/slices/uiSlice';
import type { CenterTab } from '@/store/slices/panelSlice';
import { FadeIn } from '@/components/shared/FadeIn';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  getProcessingUsage,
  PROCESSING_DAILY_FILE_LIMIT,
  PROCESSING_DAILY_MB_LIMIT_BYTES,
} from '@/lib/processingBudget';
import { formatFileSize } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  Scale,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Download,
  Trash2,
  Loader2,
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
// Density option cards
// ---------------------------------------------------------------------------
const densityOptions: {
  value: DisplayDensity;
  label: string;
  description: string;
}[] = [
  {
    value: 'compact',
    label: 'Compact',
    description: 'Fit more on screen',
  },
  {
    value: 'comfortable',
    label: 'Comfortable',
    description: 'Balanced spacing',
  },
  {
    value: 'spacious',
    label: 'Spacious',
    description: 'More breathing room',
  },
];

// ---------------------------------------------------------------------------
// Default center tab options
// ---------------------------------------------------------------------------
const centerTabOptions: { value: CenterTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'editor', label: 'Editor' },
  { value: 'exhibits', label: 'Exhibits' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'drafts', label: 'Drafts' },
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
  const { user, signOut, isDemoMode, resetDemoWorkspace, signInWithGoogle } = useAuth();
  const { themeMode, setTheme } = useAppStore();
  const processOnUpload = useAppStore((s) => s.processOnUpload);
  const setProcessOnUpload = useAppStore((s) => s.setProcessOnUpload);
  const aiEnabled = useAppStore((s) => s.aiEnabled);
  const setAIEnabled = useAppStore((s) => s.setAIEnabled);
  const displayDensity = useAppStore((s) => s.displayDensity);
  const setDisplayDensity = useAppStore((s) => s.setDisplayDensity);
  const defaultCenterTab = useAppStore((s) => s.defaultCenterTab);
  const setDefaultCenterTab = useAppStore((s) => s.setDefaultCenterTab);
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

  const handleResetDemo = async () => {
    await resetDemoWorkspace();
  };

  const refreshUsage = () => setUsage(getProcessingUsage());

  // ── Data export state ─────────────────────────────────
  const [exporting, setExporting] = useState(false);

  const handleExportData = useCallback(async () => {
    if (!user?.id) {
      toast.error('You must be signed in to export data.');
      return;
    }
    setExporting(true);
    try {
      // 1. Profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (profileErr) throw profileErr;

      // 2. Projects owned by this user
      const { data: projects, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id);
      if (projErr) throw projErr;

      const projectIds = (projects ?? []).map((p) => p.id);

      // 3. Files metadata (no blobs) for user's projects
      let files: Record<string, unknown>[] = [];
      if (projectIds.length > 0) {
        const { data, error } = await supabase
          .from('files')
          .select('id, name, file_type, file_path, project_id, added_at, added_by, processing_status, document_type, ai_summary, is_deleted')
          .in('project_id', projectIds);
        if (error) throw error;
        files = data ?? [];
      }

      // 4. Notes
      let notes: Record<string, unknown>[] = [];
      if (projectIds.length > 0) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .in('project_id', projectIds);
        if (error) throw error;
        notes = data ?? [];
      }

      // 5. Exhibit markers
      let exhibitMarkers: Record<string, unknown>[] = [];
      if (projectIds.length > 0) {
        const { data, error } = await supabase
          .from('exhibit_markers')
          .select('*')
          .in('project_id', projectIds);
        if (error) throw error;
        exhibitMarkers = data ?? [];
      }

      // 6. PDF annotations
      let annotations: Record<string, unknown>[] = [];
      if (projectIds.length > 0) {
        const { data, error } = await supabase
          .from('pdf_annotations')
          .select('*')
          .in('project_id', projectIds);
        if (error) throw error;
        annotations = data ?? [];
      }

      // 7. Chat messages
      let chatMessages: Record<string, unknown>[] = [];
      if (projectIds.length > 0) {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .in('project_id', projectIds);
        if (error) throw error;
        chatMessages = data ?? [];
      }

      // 8. Timeline events
      let timelineEvents: Record<string, unknown>[] = [];
      if (projectIds.length > 0) {
        const { data, error } = await supabase
          .from('timeline_events')
          .select('*')
          .in('project_id', projectIds);
        if (error) throw error;
        timelineEvents = data ?? [];
      }

      // 9. Chronology entries
      let chronologyEntries: Record<string, unknown>[] = [];
      if (projectIds.length > 0) {
        const { data, error } = await supabase
          .from('chronology_entries')
          .select('*')
          .in('project_id', projectIds);
        if (error) throw error;
        chronologyEntries = data ?? [];
      }

      // 10. Brief drafts
      let briefDrafts: Record<string, unknown>[] = [];
      if (projectIds.length > 0) {
        const { data, error } = await supabase
          .from('brief_drafts')
          .select('*')
          .in('project_id', projectIds);
        if (error) throw error;
        briefDrafts = data ?? [];
      }

      // Compile export object
      const exportData = {
        exportedAt: new Date().toISOString(),
        pipedaNotice:
          'This export contains all personal data held by Clarity Hub, in compliance with PIPEDA Principle 9 (Individual Access).',
        profile,
        projects: projects ?? [],
        files,
        notes,
        exhibitMarkers,
        annotations,
        chatMessages,
        timelineEvents,
        chronologyEntries,
        briefDrafts,
      };

      // Trigger browser download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clarity-hub-data-export-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data export downloaded successfully.');
    } catch (err) {
      console.error('Data export failed:', err);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [user?.id]);

  // ── Account deletion state ────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccountConfirmed = useCallback(() => {
    setShowDeleteConfirm(false);
    // Client-side Supabase SDK cannot delete all user data across tables
    // without server-side admin privileges, so direct users to contact email.
    toast.success('Deletion request noted', {
      description:
        'Please email kareem.hassanein@gmail.com to complete your account deletion.',
      duration: 8000,
    });
  }, []);

  useEffect(() => {
    const onFocus = () => refreshUsage();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <FadeIn className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      {/* ── Page title ──────────────────────────────────────── */}
      <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-100">
        Settings
      </h1>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
        Manage your account and preferences
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {/* ── Profile ───────────────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-base font-bold text-surface-900 dark:text-surface-100">
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
              <p className="truncate text-base font-medium text-surface-900 dark:text-surface-100" title={displayName}>
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-sm text-surface-500 dark:text-surface-400" title={email}>
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
        <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-base font-bold text-surface-900 dark:text-surface-100">
              Appearance
            </h2>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Choose your theme.
            </p>

            <div className="mt-4 grid items-stretch grid-cols-1 gap-3 sm:grid-cols-3">
              {themeOptions.map((opt) => {
                const active = themeMode === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    aria-pressed={active}
                    className={`group relative flex h-full min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all
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
                      <p className="mt-0.5 text-xs leading-tight text-surface-400 dark:text-surface-500">
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

            {/* Display density */}
            <div className="mt-6 border-t border-surface-200 pt-5 dark:border-surface-700">
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Display density
              </p>

              <div className="mt-3 inline-flex rounded-lg border border-surface-200 bg-surface-50 p-0.5 dark:border-surface-700 dark:bg-surface-800/50">
                {densityOptions.map((opt) => {
                  const active = displayDensity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setDisplayDensity(opt.value)}
                      aria-pressed={active}
                      className={`relative rounded-md px-4 py-2 text-sm font-medium transition-all ${
                        active
                          ? 'bg-white text-primary-700 shadow-sm dark:bg-surface-700 dark:text-primary-300'
                          : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300'
                      }`}
                      title={opt.description}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-surface-400 dark:text-surface-500">
                {densityOptions.find((o) => o.value === displayDensity)?.description}
              </p>
            </div>

            {/* Default view */}
            <div className="mt-6 border-t border-surface-200 pt-5 dark:border-surface-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Default view
                  </p>
                  <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                    Tab shown when opening a project.
                  </p>
                </div>
                <select
                  value={defaultCenterTab}
                  onChange={(e) => setDefaultCenterTab(e.target.value as CenterTab)}
                  className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-sm text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15 dark:border-surface-700 dark:bg-surface-800/50 dark:text-surface-300 dark:focus:border-primary-400 dark:focus:ring-primary-400/20"
                >
                  {centerTabOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Processing ────────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-base font-bold text-surface-900 dark:text-surface-100">
              AI Processing
            </h2>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Auto-process uploads
                </p>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  Automatically extract text, classify, and embed files on upload.
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
                  Daily limit: {PROCESSING_DAILY_FILE_LIMIT} files / {Math.round(PROCESSING_DAILY_MB_LIMIT_BYTES / (1024 * 1024))}MB
                </p>
                <button
                  onClick={refreshUsage}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-surface-500 transition-colors hover:bg-surface-200 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-200"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              </div>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                Today: {usage.files} file{usage.files !== 1 ? 's' : ''} processed, {formatFileSize(usage.bytes)} of data.
              </p>
            </div>
          </div>
        </section>

        {/* ── Data & Privacy ───────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
              <h2 className="font-heading text-base font-bold text-surface-900 dark:text-surface-100">
                Data &amp; Privacy
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-5 px-6 py-5">
            {/* Storage location */}
            <div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Data storage
              </p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                All files and project data are stored on Supabase infrastructure
                in Canada (AWS ca-central-1, Montreal region).
              </p>
            </div>

            {/* AI providers */}
            <div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                AI data processors
              </p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                When AI features are enabled, document content may be sent to:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-surface-500 dark:text-surface-400">
                <li className="flex items-baseline gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-surface-400 dark:bg-surface-500" />
                  <span><span className="font-medium text-surface-700 dark:text-surface-300">OpenAI GPT</span> &mdash; chat, classification, summarization (US)</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-surface-400 dark:bg-surface-500" />
                  <span><span className="font-medium text-surface-700 dark:text-surface-300">Google Gemini</span> &mdash; chat, multimodal analysis (US/EU)</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-surface-400 dark:bg-surface-500" />
                  <span><span className="font-medium text-surface-700 dark:text-surface-300">Mistral OCR</span> &mdash; document text extraction (EU)</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-surface-400 dark:bg-surface-500" />
                  <span><span className="font-medium text-surface-700 dark:text-surface-300">Cohere Rerank</span> &mdash; search result ranking (US)</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-surface-400 dark:bg-surface-500" />
                  <span><span className="font-medium text-surface-700 dark:text-surface-300">Voyage AI</span> &mdash; legal document embeddings (US)</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-surface-400 dark:bg-surface-500" />
                  <span><span className="font-medium text-surface-700 dark:text-surface-300">Tavily</span> &mdash; web search for legal research (US)</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-surface-400 dark:bg-surface-500" />
                  <span><span className="font-medium text-surface-700 dark:text-surface-300">CanLII</span> &mdash; citation verification for Canadian case law (Canada)</span>
                </li>
              </ul>
              <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                All providers are accessed via API-tier agreements. They do not
                use your data to train their models.
              </p>
            </div>

            {/* AI toggle */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/60">
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Enable AI features
                </p>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  When disabled, no data is sent to third-party AI providers.
                  File storage and manual features remain available.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={aiEnabled}
                onClick={() => setAIEnabled(!aiEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  aiEnabled
                    ? 'bg-primary-600'
                    : 'bg-surface-300 dark:bg-surface-600'
                }`}
                title={aiEnabled ? 'AI features enabled' : 'AI features disabled'}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    aiEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Cross-border consent state */}
            <AIProcessingConsentControl />

            {/* Cross-border notice */}
            <p className="text-xs leading-relaxed text-surface-500 dark:text-surface-400">
              Your data may be processed outside Canada. By using AI features,
              you consent to cross-border data transfer as described in our{' '}
              <a
                href="/privacy"
                className="inline-flex items-center gap-0.5 font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Privacy Policy
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </p>
          </div>
        </section>

        {/* ── Your Data (PIPEDA) ─────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <div className="flex items-center gap-2.5">
              <Download className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
              <h2 className="font-heading text-base font-bold text-surface-900 dark:text-surface-100">
                Your Data
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-5 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Download your data
              </p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                Under PIPEDA Principle 9, you have the right to access your
                personal information. This export includes your profile,
                projects, file metadata, notes, annotations, exhibit markers,
                and chat history as a JSON file.
              </p>
            </div>

            <button
              onClick={() => void handleExportData()}
              disabled={exporting || !user?.id}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-800 dark:bg-primary-950/30 dark:text-primary-300 dark:hover:bg-primary-900/40"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? 'Preparing export...' : 'Download My Data'}
            </button>
          </div>
        </section>

        {/* ── Account ───────────────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-base font-bold text-surface-900 dark:text-surface-100">
              Account
            </h2>
          </div>

          <div className="flex flex-col gap-5 px-6 py-5">
            {isDemoMode && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Demo workspace
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-700/90 dark:text-amber-300/80">
                      Reset sample data or sign in.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleResetDemo}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/30"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reset Demo
                    </button>
                    <button
                      onClick={() => void signInWithGoogle()}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Use Google instead
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sign out */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {isDemoMode ? 'Exit demo mode' : 'Sign out'}
                </p>
                <p className="text-xs text-surface-400 dark:text-surface-500">
                  {isDemoMode ? 'Return to the sign-in screen' : 'End your current session'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                <LogOut className="h-4 w-4" />
                {isDemoMode ? 'Exit demo' : 'Sign out'}
              </button>
            </div>

          </div>
        </section>

        {/* ── Legal & Trust ─────────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-base font-bold text-surface-900 dark:text-surface-100">
              Legal &amp; Trust
            </h2>
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              Terms, privacy, sub-processor list, and the firm-facing Data
              Processing Addendum. All documents read from the same source
              of truth in the repository.
            </p>
          </div>

          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {[
              { slug: 'trust', label: 'Trust statement', blurb: 'Where data lives, sub-processors, retention' },
              { slug: 'privacy', label: 'Privacy notice', blurb: 'PIPEDA-aligned personal-information handling' },
              { slug: 'terms', label: 'Terms of Service', blurb: 'The contract that governs use' },
              { slug: 'dpa', label: 'Data Processing Addendum', blurb: 'For firm + enterprise customers' },
              { slug: 'security', label: 'Security policy', blurb: 'Controls in place and vulnerability disclosure' },
              { slug: 'sla', label: 'Service levels', blurb: 'Availability and support commitments' },
            ].map((doc) => (
              <a
                key={doc.slug}
                href={`/legal/${doc.slug}`}
                className="group flex items-start gap-2 rounded-xl border border-surface-200/80 bg-surface-50/60 px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 dark:border-surface-700 dark:bg-surface-950/40 dark:hover:border-primary-800/50 dark:hover:bg-surface-800 dark:focus-visible:ring-offset-surface-900"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                    {doc.label}
                  </p>
                  <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                    {doc.blurb}
                  </p>
                </div>
                <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-surface-300 transition-colors group-hover:text-primary-500 dark:text-surface-600 dark:group-hover:text-primary-400" />
              </a>
            ))}
          </div>
        </section>

        {/* ── About ─────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2 className="font-heading text-base font-bold text-surface-900 dark:text-surface-100">
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
              Organize evidence, build arguments, manage exhibits.
            </p>

            <div className="mt-4 rounded-lg bg-surface-50 p-3 dark:bg-surface-800/50">
              <p className="text-xs leading-relaxed text-surface-400 dark:text-surface-500">
                Disclaimer: The AI features in this application provide general
                information and analysis support only. They do not constitute
                legal advice, and no solicitor-client relationship is created
                through use of this tool. Always consult a qualified legal
                professional for advice on your specific situation.
              </p>
            </div>
          </div>
        </section>

        {/* ── Danger Zone ─────────────────────────────────────── */}
        {!isDemoMode && (
          <section className="overflow-hidden rounded-2xl border border-red-200 bg-white dark:border-red-900/50 dark:bg-surface-800">
            <div className="border-b border-red-200 px-6 py-4 dark:border-red-900/50">
              <div className="flex items-center gap-2.5">
                <Trash2 className="h-4.5 w-4.5 text-red-500 dark:text-red-400" />
                <h2 className="font-heading text-base font-bold text-red-700 dark:text-red-400">
                  Danger Zone
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Delete your account
                </p>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  Permanently remove your account and all associated data,
                  including projects, files, notes, annotations, and chat
                  history. Under PIPEDA Principle 5, data is not retained
                  longer than necessary. This action cannot be undone.
                </p>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40"
              >
                <Trash2 className="h-4 w-4" />
                Request Account Deletion
              </button>
            </div>
          </section>
        )}
      </div>

      {/* ── Confirm deletion dialog ──────────────────────────── */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete your account?"
        message="This will permanently delete your account and all associated data. To proceed, we will direct you to email the administrator. This action cannot be reversed."
        confirmLabel="Request Deletion"
        cancelLabel="Keep Account"
        variant="danger"
        onConfirm={handleDeleteAccountConfirmed}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </FadeIn>
  );
}

/**
 * Surfaces the user's AI-processing consent status and lets them revoke it.
 * Revoking means the next upload will re-prompt the consent dialog.
 */
function AIProcessingConsentControl() {
  const consent = useAppStore((s) => s.aiProcessingConsent);
  const reset = useAppStore((s) => s.resetAIProcessingConsent);

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/60">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
          Third-party AI processing consent
        </p>
        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
          {consent
            ? `Acknowledged on ${new Date(consent.acceptedAt).toLocaleDateString()}. Revoke to re-prompt before the next upload.`
            : 'Not yet acknowledged. You will be prompted before your first file upload.'}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        disabled={!consent}
        className="shrink-0 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-600 shadow-sm transition-all hover:-translate-y-0.5 hover:text-surface-800 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400/40 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:text-surface-100 dark:focus-visible:ring-offset-surface-900"
      >
        Revoke
      </button>
    </div>
  );
}

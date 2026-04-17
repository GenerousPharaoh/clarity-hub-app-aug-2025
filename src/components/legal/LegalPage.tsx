import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Scale,
  FileText,
  ShieldCheck,
  FileSignature,
  Lock,
  Activity,
  FileCheck2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DocSlug = 'terms' | 'privacy' | 'dpa' | 'security' | 'sla' | 'trust';

interface DocEntry {
  slug: DocSlug;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const DOCS: DocEntry[] = [
  {
    slug: 'trust',
    label: 'Trust',
    blurb: 'Where data lives and which sub-processors touch it',
    icon: ShieldCheck,
    path: '/legal/TRUST.md',
  },
  {
    slug: 'privacy',
    label: 'Privacy',
    blurb: 'How personal information is handled',
    icon: Lock,
    path: '/legal/PRIVACY.md',
  },
  {
    slug: 'terms',
    label: 'Terms',
    blurb: 'Terms of Service',
    icon: FileText,
    path: '/legal/TERMS.md',
  },
  {
    slug: 'dpa',
    label: 'DPA',
    blurb: 'Data Processing Addendum for firm customers',
    icon: FileSignature,
    path: '/legal/DPA.md',
  },
  {
    slug: 'security',
    label: 'Security',
    blurb: 'Security posture and vulnerability disclosure',
    icon: FileCheck2,
    path: '/legal/SECURITY.md',
  },
  {
    slug: 'sla',
    label: 'Service levels',
    blurb: 'Availability and support commitments',
    icon: Activity,
    path: '/legal/SLA.md',
  },
];

function isDocSlug(value: string | undefined): value is DocSlug {
  return !!value && DOCS.some((d) => d.slug === value);
}

/**
 * Unified legal + trust hub. Renders every repo-root legal document
 * (TERMS, PRIVACY, DPA, SECURITY, SLA, TRUST) from Markdown with a
 * sidebar of tabs. Reachable at /legal/:slug?; /privacy and /terms
 * continue to work via App.tsx routing redirects to this component.
 */
export function LegalPage({ defaultSlug }: { defaultSlug?: DocSlug } = {}) {
  const navigate = useNavigate();
  const params = useParams<{ slug: string }>();
  const initialSlug: DocSlug = isDocSlug(params.slug)
    ? params.slug
    : defaultSlug ?? 'trust';
  const [activeSlug, setActiveSlug] = useState<DocSlug>(initialSlug);

  useEffect(() => {
    // Sync state when the URL changes (e.g. back button)
    if (isDocSlug(params.slug) && params.slug !== activeSlug) {
      setActiveSlug(params.slug);
    }
  }, [params.slug, activeSlug]);

  const activeDoc = useMemo(
    () => DOCS.find((d) => d.slug === activeSlug) ?? DOCS[0],
    [activeSlug]
  );

  const { content, loading, error } = useDocContent(activeDoc.path);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-surface-200 bg-white/80 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-950/80">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-1 text-sm font-medium text-surface-500 outline-none transition-colors hover:text-surface-900 focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 dark:text-surface-400 dark:hover:text-surface-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-surface-400" />
            <span className="font-heading text-sm font-semibold text-surface-900 dark:text-surface-100">
              Clarity Hub
            </span>
            <span className="rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-surface-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400">
              Legal
            </span>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[240px_1fr] md:py-12">
        {/* Sidebar */}
        <aside className="h-max md:sticky md:top-[5.5rem]">
          <nav className="flex flex-col gap-1" aria-label="Legal documents">
            {DOCS.map((doc) => {
              const Icon = doc.icon;
              const isActive = doc.slug === activeSlug;
              return (
                <button
                  key={doc.slug}
                  onClick={() => {
                    setActiveSlug(doc.slug);
                    navigate(`/legal/${doc.slug}`, { replace: true });
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2',
                    'dark:focus-visible:ring-offset-surface-950',
                    isActive
                      ? 'border-primary-200 bg-white shadow-sm dark:border-primary-800/50 dark:bg-surface-900'
                      : 'border-transparent hover:border-surface-200 hover:bg-white dark:hover:border-surface-800 dark:hover:bg-surface-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0 transition-colors',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300'
                    )}
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm font-semibold leading-tight',
                        isActive
                          ? 'text-surface-900 dark:text-surface-100'
                          : 'text-surface-600 dark:text-surface-300'
                      )}
                    >
                      {doc.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-surface-400 dark:text-surface-500">
                      {doc.blurb}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          <article
            className={cn(
              'prose prose-sm max-w-none rounded-2xl border border-surface-200 bg-white p-6 shadow-sm md:p-10',
              'dark:prose-invert dark:border-surface-800 dark:bg-surface-900',
              // Tighten some long-form elements so the legal text reads like a contract
              'prose-headings:font-heading prose-headings:tracking-tight',
              'prose-h1:mt-0 prose-h1:mb-4 prose-h1:text-2xl prose-h1:font-bold md:prose-h1:text-3xl',
              'prose-h2:mt-8 prose-h2:text-lg prose-h2:font-semibold',
              'prose-h3:text-base prose-h3:font-semibold',
              'prose-p:leading-relaxed prose-p:text-surface-700 dark:prose-p:text-surface-300',
              'prose-li:my-0.5',
              'prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-primary-400',
              'prose-code:rounded prose-code:bg-surface-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono dark:prose-code:bg-surface-800',
              'prose-table:text-xs prose-th:text-left prose-th:font-semibold',
              'prose-blockquote:border-l-2 prose-blockquote:border-accent-300 prose-blockquote:pl-3 prose-blockquote:text-surface-500 prose-blockquote:italic'
            )}
          >
            {loading && (
              <div className="flex items-center gap-3 py-12 text-sm text-surface-500 dark:text-surface-400">
                <Loader2 className="h-4 w-4 animate-spin text-accent-500" />
                Loading {activeDoc.label.toLowerCase()}…
              </div>
            )}

            {!loading && error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Could not load this document.</p>
                  <p className="mt-1 text-xs">
                    {error}. You can also read it directly in the repository.
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && content && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            )}
          </article>

          <p className="mt-4 px-1 text-center text-xs text-surface-400 dark:text-surface-600">
            These documents are the authoritative, up-to-date versions. The
            repository root contains the same files so they can be reviewed
            alongside the codebase.
          </p>
        </main>
      </div>
    </div>
  );
}

// ── Fetch helper ────────────────────────────────────────────────

function useDocContent(path: string) {
  const [state, setState] = useState<{
    content: string | null;
    loading: boolean;
    error: string | null;
  }>({ content: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ content: null, loading: true, error: null });
    fetch(path)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setState({ content: text, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            content: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}

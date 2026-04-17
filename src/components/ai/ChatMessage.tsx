import { memo, useMemo, useCallback, useState, useEffect, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Register only the languages we actually need (saves ~600KB vs full Prism)
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('markdown', markdown);
import { cn } from '@/lib/utils';
import { parseStructuredResponse, type ConfidenceLevel } from '@/lib/parseStructuredResponse';
import { toast } from 'sonner';
import {
  User,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Globe,
  ChevronDown,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  X,
} from 'lucide-react';
import { ChatCitation, SourcesList } from './ChatCitation';
import { FollowUpSuggestions } from './FollowUpSuggestions';
import { useCitationVerification, type CitationVerification } from '@/hooks/useCitationVerification';
import type { ChatMessage as ChatMessageType, ChatSource, WebSource } from '@/types';

/** Pattern for neutral legal citations that CanLII can resolve — must match api/canlii-verify.ts */
const NEUTRAL_CITE_PATTERN = /(\d{4})\s+(SCC|ONCA|ONSC|HRTO|CanLII|BCCA|ABCA)\s+(\d+)/gi;

/** Statuses that should block "copy to draft" until the user explicitly acknowledges. */
function isFlaggedStatus(status: CitationVerification['status']): boolean {
  return status === 'not_found' || status === 'unverified' || status === 'error';
}

function normalizeCite(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

function findVerification(
  citation: string,
  verifications: CitationVerification[] | undefined
): CitationVerification | undefined {
  if (!verifications) return undefined;
  const key = normalizeCite(citation);
  return verifications.find((v) => normalizeCite(v.citation) === key);
}

function canliiSearchUrl(citation: string): string {
  return `https://www.canlii.org/en/#search/text=${encodeURIComponent(citation)}`;
}

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (messageId: string) => void;
  isLatest?: boolean;
  onFollowUpSelect?: (text: string) => void;
}

const MODEL_CONFIG = {
  gemini: {
    label: 'Gemini',
    tooltip: 'Fast responses for general questions',
    className:
      'bg-primary-100 text-primary-700 ring-1 ring-primary-200/60 dark:bg-primary-900/40 dark:text-primary-300 dark:ring-primary-700/40',
  },
  gpt: {
    label: 'GPT-5.2',
    tooltip: 'Deep reasoning for complex legal analysis',
    className:
      'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/40',
  },
} as const;


const EFFORT_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  deep: { label: 'Deep analysis', className: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' },
};

/**
 * Inline chip that wraps a neutral-citation reference in the message body
 * with its CanLII verification status. The chip is the primary visual signal
 * that a lawyer should not trust a citation at face value — verified chips
 * link to CanLII; flagged chips route to a manual CanLII search.
 */
function LegalCitationChip({
  citation,
  verification,
  isFetching,
}: {
  citation: string;
  verification?: CitationVerification;
  isFetching: boolean;
}) {
  // Pending (verification hasn't resolved yet OR is loading)
  if (!verification && isFetching) {
    return (
      <span className="mx-0.5 inline-flex items-center gap-1 rounded-md border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-sm font-medium leading-tight text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
        <span>{citation}</span>
      </span>
    );
  }

  // Verified — link to the real CanLII doc
  if (verification?.status === 'verified' && verification.canliiUrl) {
    return (
      <a
        href={verification.canliiUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={verification.canliiTitle ? `${verification.canliiTitle}\nVerified on CanLII` : 'Verified on CanLII'}
        className="mx-0.5 inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-1.5 py-0.5 text-sm font-medium leading-tight text-green-700 no-underline transition-colors hover:border-green-300 hover:bg-green-100 dark:border-green-800/60 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
      >
        <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>{citation}</span>
      </a>
    );
  }

  // Not found in CanLII — treat as potential fabrication
  if (verification?.status === 'not_found') {
    return (
      <a
        href={canliiSearchUrl(citation)}
        target="_blank"
        rel="noopener noreferrer"
        title="Not found in CanLII. Click to search manually. Do not cite without verification."
        className="mx-0.5 inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-1.5 py-0.5 text-sm font-semibold leading-tight text-red-700 no-underline transition-colors hover:bg-red-100 dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
      >
        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="line-through decoration-red-400/60 decoration-1">{citation}</span>
      </a>
    );
  }

  // Unverified / error (wrong format, legislation ref, CanLII error, etc.)
  return (
    <a
      href={canliiSearchUrl(citation)}
      target="_blank"
      rel="noopener noreferrer"
      title={verification?.message ?? 'Could not auto-verify. Click to search CanLII manually.'}
      className="mx-0.5 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-sm font-medium leading-tight text-amber-700 no-underline transition-colors hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{citation}</span>
    </a>
  );
}

/**
 * Wrap legal citation patterns in a text segment with LegalCitationChip.
 * Runs AFTER the [Source N] / [Web N] wrapper so it never touches those tokens.
 */
function wrapLegalCitations(
  text: string,
  verifications: CitationVerification[] | undefined,
  isFetching: boolean
): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = new RegExp(NEUTRAL_CITE_PATTERN.source, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const citation = match[0];
    const verification = findVerification(citation, verifications);
    parts.push(
      <LegalCitationChip
        key={`cite-${match.index}-${citation}`}
        citation={citation}
        verification={verification}
        isFetching={isFetching}
      />
    );
    lastIndex = match.index + citation.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Inline web citation chip that renders [Web N] references as clickable links.
 */
function WebCitationChip({ source }: { source: WebSource }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 mx-0.5',
        'text-sm font-medium leading-tight',
        'bg-blue-50 text-blue-700 border border-blue-200',
        'hover:bg-blue-100 hover:border-blue-300',
        'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
        'dark:hover:bg-blue-900/50 dark:hover:border-blue-600',
        'transition-colors cursor-pointer no-underline'
      )}
      title={`${source.title}\n${source.url}`}
    >
      <Globe className="h-3 w-3 shrink-0" />
      <span>Web {source.index}</span>
    </a>
  );
}

/**
 * Replace [Source N], [Web N], and neutral legal citations with interactive
 * components. Legal citations get a CanLII verification badge so the reader
 * can tell at a glance which cites are real, which are not-found, and which
 * failed to auto-verify.
 */
function renderWithCitations(
  text: string,
  sources?: ChatSource[],
  webSources?: WebSource[],
  verifications?: CitationVerification[],
  isVerifying?: boolean
): ReactNode[] {
  const hasSources = sources && sources.length > 0;
  const hasWebSources = webSources && webSources.length > 0;
  const hasVerifications = (verifications && verifications.length > 0) || !!isVerifying;

  if (!hasSources && !hasWebSources && !hasVerifications) return [text];

  const parts: ReactNode[] = [];
  // Match both [Source N ...] and [Web N ...] patterns
  const regex = /\[(?:(Source)\s+(\d+)(?:[^\]]*?)|(Web)\s+(\d+)(?:[^\]]*?))\]/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const appendText = (segment: string) => {
    if (!segment) return;
    // Second pass: wrap legal citations inside the segment, if verification is active
    if (hasVerifications) {
      parts.push(...wrapLegalCitations(segment, verifications, !!isVerifying));
    } else {
      parts.push(segment);
    }
  };

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      appendText(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      const sourceNum = parseInt(match[2], 10);
      const source = sources?.find((s) => s.sourceIndex === sourceNum);
      if (source) {
        parts.push(<ChatCitation key={`src-${match.index}`} source={source} />);
      } else {
        parts.push(match[0]);
      }
    } else if (match[3]) {
      const webNum = parseInt(match[4], 10);
      const webSource = webSources?.find((w) => w.index === webNum);
      if (webSource) {
        parts.push(<WebCitationChip key={`web-${match.index}`} source={webSource} />);
      } else {
        parts.push(match[0]);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    appendText(text.slice(lastIndex));
  }

  return parts;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Detect if the current theme is dark by checking the <html> class */
function useIsDark(): boolean {
  // Check at render time — this is fine for a memoized component
  // since theme changes cause a re-render via parent context
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

/** Detect if a message is an error response from the AI */
function isErrorMessage(content: string): boolean {
  return (
    content.startsWith('I encountered an error:') ||
    content.startsWith('An unexpected error occurred') ||
    content.startsWith('API key error') ||
    content.startsWith('Rate limit reached') ||
    content.startsWith('Network error') ||
    content.startsWith('Model unavailable') ||
    content.startsWith('AI error:') ||
    content.startsWith('The AI service flagged')
  );
}

/** Code block with copy button */
function CodeBlock({
  language,
  code,
  isDark,
}: {
  language: string;
  code: string;
  isDark: boolean;
}) {
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCodeCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch { /* clipboard API may be unavailable */ }
  }, [code]);

  return (
    <div className="group/code my-2 overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700">
      <div className="flex h-7 items-center justify-between bg-surface-100 px-3 dark:bg-surface-800">
        <span className="font-mono text-xs text-surface-500 dark:text-surface-400">
          {language}
        </span>
        <button
          onClick={handleCodeCopy}
          className={cn(
            'flex h-5 items-center gap-1 rounded px-2 text-sm font-medium transition-all',
            'opacity-0 group-hover/code:opacity-100',
            codeCopied
              ? 'text-green-600 dark:text-green-400'
              : 'text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300'
          )}
        >
          {codeCopied ? (
            <><Check className="h-3.5 w-3.5" /> Copied</>
          ) : (
            <><Copy className="h-3.5 w-3.5" /> Copy</>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '12px',
          fontSize: '11px',
          lineHeight: '1.6',
          background: 'transparent',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * Process React children from ReactMarkdown to replace [Source N] and [Web N] text nodes
 * with interactive citation components. Also wraps neutral legal citations in verification chips.
 */
function processChildrenForCitations(
  children: ReactNode,
  sources: ChatSource[],
  webSources?: WebSource[],
  verifications?: CitationVerification[],
  isVerifying?: boolean
): ReactNode {
  if (!children) return children;

  // Handle array of children
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        const parts = renderWithCitations(child, sources, webSources, verifications, isVerifying);
        return parts.length === 1 && typeof parts[0] === 'string'
          ? parts[0]
          : <span key={i}>{parts}</span>;
      }
      return child;
    });
  }

  // Handle single string child
  if (typeof children === 'string') {
    const parts = renderWithCitations(children, sources, webSources, verifications, isVerifying);
    return parts.length === 1 && typeof parts[0] === 'string'
      ? parts[0]
      : <span>{parts}</span>;
  }

  return children;
}

// ============================================================
// Confidence badge colors
// ============================================================
const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        CONFIDENCE_COLORS[level]
      )}
    >
      {level === 'high' && 'High confidence'}
      {level === 'medium' && 'Medium confidence'}
      {level === 'low' && 'Low confidence'}
    </span>
  );
}

/**
 * A collapsible section with a small toggle button and bordered content area.
 */
function CollapsibleSection({ label, content }: { label: string; content: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="text-xs text-surface-500 flex items-center gap-1 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
      >
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
        {label}
      </button>
      {expanded && (
        <div className="mt-1 rounded-lg border border-surface-100 dark:border-surface-700 px-3 py-2">
          <div className="prose-chat min-w-0 text-[13px] leading-relaxed break-words text-surface-700 dark:text-surface-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export const ChatMessageComponent = memo(function ChatMessageComponent({
  message,
  onRetry,
  isLatest,
  onFollowUpSelect,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isDark = useIsDark();
  const isError = !isUser && isErrorMessage(message.content);
  const [copied, setCopied] = useState(false);
  const [copyGuardOpen, setCopyGuardOpen] = useState(false);

  const timestamp = useMemo(
    () => formatTimestamp(message.timestamp),
    [message.timestamp]
  );

  const handleRetry = useCallback(() => {
    if (onRetry) onRetry(message.id);
  }, [onRetry, message.id]);

  // Parse structured response markers for assistant messages
  const structured = useMemo(
    () => (!isUser && !isErrorMessage(message.content))
      ? parseStructuredResponse(message.content)
      : null,
    [isUser, message.content]
  );

  // Async citation verification against CanLII
  const { data: verificationResults, isFetching: isVerifying } = useCitationVerification(
    message.id,
    message.citations ?? []
  );

  const hasCitationsToCheck = (message.citations?.length ?? 0) > 0;
  const flaggedCitations = useMemo(
    () => (verificationResults ?? []).filter((r) => isFlaggedStatus(r.status)),
    [verificationResults]
  );
  const verifiedCount = (verificationResults ?? []).filter((r) => r.status === 'verified').length;
  const showVerifyingBanner = hasCitationsToCheck && isVerifying && !verificationResults;
  const showFlaggedBanner = !isVerifying && flaggedCitations.length > 0;

  const writeToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Clipboard unavailable in this browser');
    }
  }, []);

  const performCopy = useCallback(
    async (withDisclaimer: boolean) => {
      let payload = message.content;
      if (withDisclaimer && flaggedCitations.length > 0) {
        const list = flaggedCitations.map((c) => c.citation).join('; ');
        payload +=
          `\n\n---\n[Clarity Hub warning] The following citations were NOT auto-verified against CanLII and may be inaccurate or fabricated: ${list}. ` +
          `Verify each on CanLII before relying on this text.`;
      }
      await writeToClipboard(payload);
      setCopyGuardOpen(false);
    },
    [message.content, flaggedCitations, writeToClipboard]
  );

  const handleCopy = useCallback(async () => {
    // Hard gate — never copy while verification is in flight. A lawyer should
    // not paste half-checked output into a draft.
    if (hasCitationsToCheck && isVerifying) {
      toast.info('Still verifying citations — one moment…');
      return;
    }
    if (flaggedCitations.length > 0) {
      setCopyGuardOpen(true);
      return;
    }
    await performCopy(false);
  }, [hasCitationsToCheck, isVerifying, flaggedCitations.length, performCopy]);

  // Content to render in the main ReactMarkdown block
  const displayContent = structured?.isStructured ? structured.answer : message.content;

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2" aria-label="Your message">
        <div className="flex max-w-[88%] items-end gap-2">
          <div>
            <span className="sr-only">You said:</span>
            <div className="rounded-2xl rounded-br-md bg-primary-600 px-3 py-2 text-[13px] leading-relaxed text-white shadow-elevated break-words">
              {message.content}
            </div>
            <div className="mt-1 text-right text-xs text-surface-400 dark:text-surface-500">
              {timestamp}
            </div>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
            <User className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  const srLabel = `Clarity Hub${message.model ? ` (${message.model})` : ''} replied:`;
  const modelConfig = message.model ? MODEL_CONFIG[message.model] : null;

  return (
    <div className="flex justify-start px-4 py-2" aria-label="Assistant message">
      <span className="sr-only">{srLabel}</span>
      <div className="group flex max-w-[90%] items-start gap-2">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            isError
              ? 'bg-red-100 dark:bg-red-900/40'
              : 'bg-accent-100 dark:bg-accent-900/40'
          )}
        >
          {isError ? (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-accent-600 dark:text-accent-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {/* Model + mode badge */}
          {(modelConfig || message.effortLevel) && !isError && (
            <div className="mb-1.5 flex flex-nowrap items-center gap-1.5 overflow-hidden">
              {modelConfig && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-1 text-sm font-medium',
                    modelConfig.className
                  )}
                  title={modelConfig.tooltip}
                >
                  {modelConfig.label}
                </span>
              )}
              {message.effortLevel === 'deep' && EFFORT_BADGE_CONFIG.deep && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-1 text-sm font-medium',
                    EFFORT_BADGE_CONFIG.deep.className
                  )}
                >
                  {EFFORT_BADGE_CONFIG.deep.label}
                </span>
              )}
            </div>
          )}

          {/* Message content */}
          <div
            className={cn(
              'group/msg relative rounded-2xl rounded-tl-md px-3 py-2 shadow-sm',
              isError
                ? 'bg-red-50 ring-1 ring-red-200/80 dark:bg-red-950/30 dark:ring-red-800/50'
                : 'bg-white border border-translucent border-l-2 border-l-accent-400/30 dark:bg-surface-800 dark:border-l-accent-500/25'
            )}
          >
            {/* Copy button — visible on hover. Reflects pending/flagged state so the
                user can't accidentally copy half-checked output into a draft. */}
            {!isError && (
              <button
                onClick={handleCopy}
                disabled={showVerifyingBanner}
                aria-label={
                  showVerifyingBanner
                    ? 'Verifying citations'
                    : flaggedCitations.length > 0
                      ? `Copy ${flaggedCitations.length} unverified citation${flaggedCitations.length === 1 ? '' : 's'} — review required`
                      : 'Copy to clipboard'
                }
                className={cn(
                  'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md transition-all',
                  'opacity-60 group-hover/msg:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                  copied
                    ? 'bg-green-100 text-green-600 focus-visible:ring-green-500/50 dark:bg-green-900/30 dark:text-green-400'
                    : showVerifyingBanner
                      ? 'cursor-wait bg-surface-100 text-surface-400 dark:bg-surface-700 dark:text-surface-500'
                      : flaggedCitations.length > 0
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 focus-visible:ring-amber-500/50 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-surface-100 text-surface-400 hover:bg-surface-200 hover:text-surface-600 focus-visible:ring-surface-400/50 dark:bg-surface-700 dark:text-surface-500 dark:hover:bg-surface-600 dark:hover:text-surface-300'
                )}
                title={
                  showVerifyingBanner
                    ? 'Verifying citations…'
                    : flaggedCitations.length > 0
                      ? `${flaggedCitations.length} citation${flaggedCitations.length === 1 ? '' : 's'} need review before copying`
                      : 'Copy to clipboard'
                }
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : showVerifyingBanner ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : flaggedCitations.length > 0 ? (
                  <ShieldAlert className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {/* Verification banner — pending */}
            {!isError && showVerifyingBanner && (
              <div
                role="status"
                className="mb-2 flex items-center gap-2 rounded-lg border border-surface-200/80 bg-surface-50/80 px-2.5 py-1.5 text-xs text-surface-600 dark:border-surface-700/80 dark:bg-surface-900/40 dark:text-surface-300"
              >
                <Loader2 className="h-3 w-3 shrink-0 animate-spin text-accent-500" aria-hidden="true" />
                <span>
                  Checking {message.citations?.length ?? 0} citation
                  {(message.citations?.length ?? 0) === 1 ? '' : 's'} against CanLII — don&apos;t
                  copy this into a draft yet.
                </span>
              </div>
            )}

            {/* Verification banner — flagged */}
            {!isError && showFlaggedBanner && (
              <div
                role="alert"
                className="mb-2 rounded-lg border border-amber-300/80 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200"
              >
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">
                      {flaggedCitations.length} of {flaggedCitations.length + verifiedCount} citation
                      {flaggedCitations.length + verifiedCount === 1 ? '' : 's'} could not be verified.
                    </p>
                    <p className="mt-0.5 leading-snug text-amber-700/90 dark:text-amber-300/90">
                      Review each on CanLII before quoting or filing. AI-generated citations can be fabricated.
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-1">
                      {flaggedCitations.map((c) => (
                        <li key={c.citation}>
                          <a
                            href={canliiSearchUrl(c.citation)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={c.message ?? 'Search CanLII manually'}
                            className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white/60 px-1.5 py-0.5 font-medium text-amber-800 transition-colors hover:bg-white dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/40"
                          >
                            <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                            {c.citation}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div
              className={cn(
                'prose-chat min-w-0 text-[13px] leading-relaxed break-words',
                isError
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-surface-700 dark:text-surface-200'
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (match) {
                      return (
                        <CodeBlock
                          language={match[1]}
                          code={codeString}
                          isDark={isDark}
                        />
                      );
                    }

                    return (
                      <code
                        className="rounded bg-surface-100 px-1 py-0.5 font-mono text-xs text-accent-700 dark:bg-surface-800 dark:text-accent-300"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => {
                    // Process children to replace [Source N], [Web N], and neutral legal citations with chips
                    const hasCitations =
                      (message.sources && message.sources.length > 0) ||
                      (message.webSources && message.webSources.length > 0) ||
                      hasCitationsToCheck;
                    if (hasCitations) {
                      const processed = processChildrenForCitations(
                        children,
                        message.sources ?? [],
                        message.webSources,
                        verificationResults,
                        isVerifying
                      );
                      return <p className="mb-2 last:mb-0">{processed}</p>;
                    }
                    return <p className="mb-2 last:mb-0">{children}</p>;
                  },
                  li: ({ children }) => {
                    // Same treatment inside list items (many AI answers bullet their authorities)
                    const hasCitations =
                      (message.sources && message.sources.length > 0) ||
                      (message.webSources && message.webSources.length > 0) ||
                      hasCitationsToCheck;
                    if (hasCitations) {
                      const processed = processChildrenForCitations(
                        children,
                        message.sources ?? [],
                        message.webSources,
                        verificationResults,
                        isVerifying
                      );
                      return <li className="text-[13px]">{processed}</li>;
                    }
                    return <li className="text-[13px]">{children}</li>;
                  },
                  ul: ({ children }) => (
                    <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
                  ),
                  h1: ({ children }) => (
                    <h1 className="mb-2 mt-3 font-heading text-base font-bold first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-2 mt-3 font-heading text-sm font-bold first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-1.5 mt-2 font-heading text-sm font-semibold first:mt-0">
                      {children}
                    </h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-2 border-accent-300 pl-3 italic text-surface-500 dark:border-accent-600 dark:text-surface-400">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => {
                    // Sanitize: only allow http(s) and mailto links
                    const isSafe = href && (href.startsWith('https://') || href.startsWith('http://') || href.startsWith('mailto:'));
                    if (!isSafe) return <span className="underline">{children}</span>;
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 underline decoration-primary-300 hover:text-primary-700 dark:text-primary-400 dark:decoration-primary-700"
                      >
                        {children}
                      </a>
                    );
                  },
                  table: ({ children }) => (
                    <div className="my-2 overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700">
                      <table className="min-w-full text-[12px]">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border-b border-surface-200 bg-surface-50 px-3 py-1.5 text-left font-semibold dark:border-surface-700 dark:bg-surface-800">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-b border-surface-100 px-3 py-1.5 dark:border-surface-700">
                      {children}
                    </td>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-surface-800 dark:text-surface-100">
                      {children}
                    </strong>
                  ),
                  hr: () => (
                    <hr className="my-3 border-surface-200 dark:border-surface-700" />
                  ),
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>

            {/* Structured response: confidence badge + collapsible sections */}
            {structured?.isStructured && (
              <div className="mt-2 space-y-1">
                {structured.confidence && (
                  <ConfidenceBadge level={structured.confidence} />
                )}
                {structured.reasoning && (
                  <CollapsibleSection label="Show reasoning" content={structured.reasoning} />
                )}
                {structured.sources && (
                  <CollapsibleSection label="Sources cited" content={structured.sources} />
                )}
              </div>
            )}
          </div>

          {/* Sources list */}
          {!isError && message.sources && message.sources.length > 0 && (
            <div className="mt-1">
              <SourcesList sources={message.sources} />
            </div>
          )}

          {/* Web sources list */}
          {!isError && message.webSources && message.webSources.length > 0 && (
            <WebSourcesList webSources={message.webSources} />
          )}

          {/* Citation verification badges */}
          {!isError && verificationResults && verificationResults.length > 0 && (
            <CitationVerificationBadges results={verificationResults} />
          )}

          {/* Retry button for error messages */}
          {isError && onRetry && (
            <button
              onClick={handleRetry}
              className="mt-1.5 flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}

          {/* Timestamp */}
          <div className="mt-1 text-xs text-surface-400 dark:text-surface-500">{timestamp}</div>

          {/* Follow-up suggestions on latest assistant message */}
          {isLatest && !isError && message.followUps && message.followUps.length > 0 && onFollowUpSelect && (
            <div className="mt-2">
              <FollowUpSuggestions
                suggestions={message.followUps}
                onSelect={onFollowUpSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* Hard gate on copy when any citation is flagged — the lawyer must
          explicitly acknowledge before clipboard is written, and the pasted
          text carries a warning footer. */}
      <CopyGuardDialog
        open={copyGuardOpen}
        flagged={flaggedCitations}
        onCancel={() => setCopyGuardOpen(false)}
        onCopyWithDisclaimer={() => performCopy(true)}
        onCopyAnyway={() => performCopy(false)}
      />
    </div>
  );
});

/**
 * Hard-gate dialog shown when a lawyer tries to copy AI output that contains
 * flagged citations. Requires explicit acknowledgment and offers a footer
 * disclaimer that travels with the text.
 */
function CopyGuardDialog({
  open,
  flagged,
  onCancel,
  onCopyWithDisclaimer,
  onCopyAnyway,
}: {
  open: boolean;
  flagged: CitationVerification[];
  onCancel: () => void;
  onCopyWithDisclaimer: () => void;
  onCopyAnyway: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-surface-950/40 backdrop-blur-sm dark:bg-surface-950/60"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-labelledby="copy-guard-title"
        aria-describedby="copy-guard-desc"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
          'rounded-xl border border-surface-200 bg-white p-5 shadow-overlay',
          'dark:border-surface-700 dark:bg-surface-800',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                id="copy-guard-title"
                className="font-heading text-sm font-semibold text-surface-800 dark:text-surface-100"
              >
                {flagged.length} citation{flagged.length === 1 ? '' : 's'} not auto-verified
              </h3>
              <button
                onClick={onCancel}
                aria-label="Close"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p
              id="copy-guard-desc"
              className="mt-1.5 text-xs leading-relaxed text-surface-500 dark:text-surface-400"
            >
              AI-generated case citations are sometimes fabricated. Verify each of these on CanLII
              before pasting this text into a factum, brief, or court filing.
            </p>

            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-surface-100 bg-surface-50/60 p-2 dark:border-surface-700 dark:bg-surface-900/40">
              {flagged.map((c) => (
                <li
                  key={c.citation}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="min-w-0 truncate font-mono text-amber-700 dark:text-amber-300" title={c.citation}>
                    {c.citation}
                  </span>
                  <a
                    href={canliiSearchUrl(c.citation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-xs font-medium text-amber-700 shadow-sm transition-colors hover:bg-amber-50 dark:bg-surface-800 dark:text-amber-300 dark:hover:bg-amber-900/30"
                  >
                    <ExternalLink className="h-3 w-3" />
                    CanLII
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={onCopyWithDisclaimer}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary-500/20 transition-all hover:bg-primary-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 active:scale-[0.98] dark:focus-visible:ring-offset-surface-800"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Copy with unverified-citation warning
              </button>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={onCancel}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-surface-500 transition-all hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400/40 active:scale-[0.98] dark:text-surface-400 dark:hover:bg-surface-700"
                >
                  Cancel
                </button>
                <button
                  onClick={onCopyAnyway}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-surface-500 transition-all hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400/40 active:scale-[0.98] dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-200"
                >
                  Copy without warning
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Summary line showing CanLII citation verification results.
 * Only rendered after verification completes (no loading state).
 */
function CitationVerificationBadges({ results }: { results: import('@/hooks/useCitationVerification').CitationVerification[] }) {
  const verified = results.filter((r) => r.status === 'verified').length;
  const unverified = results.filter((r) => r.status === 'unverified').length;
  const notFound = results.filter((r) => r.status === 'not_found').length;

  if (verified === 0 && unverified === 0 && notFound === 0) return null;

  return (
    <div className="mt-1.5 flex items-center gap-3 text-xs">
      {verified > 0 && (
        <span className="text-green-600 dark:text-green-400">
          {'\u2713'} {verified} verified
        </span>
      )}
      {unverified > 0 && (
        <span className="text-amber-500 dark:text-amber-400">
          {'\u26A0'} {unverified} unverified
        </span>
      )}
      {notFound > 0 && (
        <span className="text-red-500 dark:text-red-400">
          {'\u2717'} {notFound} not found
        </span>
      )}
    </div>
  );
}

/**
 * Collapsible list of web sources used in the AI response.
 */
function WebSourcesList({ webSources }: { webSources: WebSource[] }) {
  const [expanded, setExpanded] = useState(false);

  if (webSources.length === 0) return null;

  return (
    <div className="mt-1.5 border-t border-blue-100 pt-1.5 dark:border-blue-900/40">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1 text-sm font-medium text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
      >
        <Globe className="h-3 w-3" />
        <span>{expanded ? 'Hide' : 'Show'} {webSources.length} web source{webSources.length !== 1 ? 's' : ''}</span>
      </button>

      {expanded && (
        <div className="mt-1 space-y-0.5">
          {webSources.map((ws) => (
            <a
              key={ws.index}
              href={ws.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left',
                'transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20'
              )}
            >
              <Globe className="h-3 w-3 shrink-0 text-blue-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-blue-600 dark:text-blue-300" title={ws.title}>
                  [{ws.index}] {ws.title}
                </p>
                <p className="truncate text-xs text-blue-400 dark:text-blue-500" title={ws.url}>
                  {ws.url}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

import { memo, useMemo, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { User, Sparkles, AlertTriangle, RotateCcw, Copy, Check } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (messageId: string) => void;
}

const MODEL_CONFIG = {
  gemini: {
    label: 'Gemini',
    className:
      'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  gpt: {
    label: 'GPT-5.2',
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
} as const;

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
        <span className="font-mono text-[10px] text-surface-500 dark:text-surface-400">
          {language}
        </span>
        <button
          onClick={handleCodeCopy}
          className={cn(
            'flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-medium transition-all',
            'opacity-0 group-hover/code:opacity-100',
            codeCopied
              ? 'text-green-600 dark:text-green-400'
              : 'text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300'
          )}
        >
          {codeCopied ? (
            <><Check className="h-3 w-3" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3" /> Copy</>
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

export const ChatMessageComponent = memo(function ChatMessageComponent({
  message,
  onRetry,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isDark = useIsDark();
  const isError = !isUser && isErrorMessage(message.content);
  const [copied, setCopied] = useState(false);

  const timestamp = useMemo(
    () => formatTimestamp(message.timestamp),
    [message.timestamp]
  );

  const handleRetry = useCallback(() => {
    if (onRetry) onRetry(message.id);
  }, [onRetry, message.id]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard API may be unavailable */ }
  }, [message.content]);

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="flex max-w-[85%] items-end gap-2">
          <div>
            <div className="rounded-2xl rounded-br-md bg-primary-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white break-words">
              {message.content}
            </div>
            <div className="mt-1 text-right text-[10px] text-surface-400">
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
  const modelConfig = message.model ? MODEL_CONFIG[message.model] : null;

  return (
    <div className="flex justify-start px-4 py-2">
      <div className="flex max-w-[90%] items-start gap-2">
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
          {/* Model badge */}
          {modelConfig && !isError && (
            <div className="mb-1.5">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  modelConfig.className
                )}
                title={
                  message.model === 'gpt'
                    ? 'GPT-5.2 — used for deep legal reasoning and complex analysis'
                    : 'Gemini — used for general questions and file analysis'
                }
              >
                {modelConfig.label}
              </span>
            </div>
          )}

          {/* Message content */}
          <div
            className={cn(
              'group/msg relative rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm',
              isError
                ? 'bg-red-50 ring-1 ring-red-200/80 dark:bg-red-900/20 dark:ring-red-800/50'
                : 'bg-white ring-1 ring-surface-200/80 dark:bg-surface-800 dark:ring-surface-700/50'
            )}
          >
            {/* Copy button — visible on hover */}
            {!isError && (
              <button
                onClick={handleCopy}
                className={cn(
                  'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md transition-all',
                  'opacity-0 group-hover/msg:opacity-100',
                  copied
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-surface-100 text-surface-400 hover:bg-surface-200 hover:text-surface-600 dark:bg-surface-700 dark:text-surface-500 dark:hover:bg-surface-600 dark:hover:text-surface-300'
                )}
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}
            <div
              className={cn(
                'prose-chat text-[13px] leading-relaxed break-words',
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
                        className="rounded bg-surface-100 px-1 py-0.5 font-mono text-[11px] text-accent-700 dark:bg-surface-800 dark:text-accent-300"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
                  ),
                  li: ({ children }) => <li className="text-[13px]">{children}</li>,
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
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Retry button for error messages */}
          {isError && onRetry && (
            <button
              onClick={handleRetry}
              className="mt-1.5 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          )}

          {/* Timestamp */}
          <div className="mt-1 text-[10px] text-surface-400">{timestamp}</div>
        </div>
      </div>
    </div>
  );
});

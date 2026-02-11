import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { User, Sparkles } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
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

export const ChatMessageComponent = memo(function ChatMessageComponent({
  message,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  const timestamp = useMemo(
    () => formatTimestamp(message.timestamp),
    [message.timestamp]
  );

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="flex max-w-[85%] items-end gap-2">
          <div>
            <div className="rounded-2xl rounded-br-md bg-primary-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
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
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/40">
          <Sparkles className="h-3.5 w-3.5 text-accent-600 dark:text-accent-400" />
        </div>
        <div className="min-w-0 flex-1">
          {/* Model badge */}
          {modelConfig && (
            <div className="mb-1.5">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  modelConfig.className
                )}
              >
                {modelConfig.label}
              </span>
            </div>
          )}

          {/* Message content */}
          <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 shadow-sm ring-1 ring-surface-200/80 dark:bg-surface-800 dark:ring-surface-700/50">
            <div className="prose-chat text-[13px] leading-relaxed text-surface-700 dark:text-surface-200">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (match) {
                      return (
                        <div className="my-2 overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700">
                          <div className="flex h-7 items-center bg-surface-100 px-3 dark:bg-surface-800">
                            <span className="font-mono text-[10px] text-surface-500 dark:text-surface-400">
                              {match[1]}
                            </span>
                          </div>
                          <SyntaxHighlighter
                            style={oneLight}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: '12px',
                              fontSize: '11px',
                              lineHeight: '1.5',
                              background: 'transparent',
                            }}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
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
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 underline decoration-primary-300 hover:text-primary-700 dark:text-primary-400 dark:decoration-primary-700"
                    >
                      {children}
                    </a>
                  ),
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

          {/* Timestamp */}
          <div className="mt-1 text-[10px] text-surface-400">{timestamp}</div>
        </div>
      </div>
    </div>
  );
});

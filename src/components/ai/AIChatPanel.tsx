import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatMessageComponent } from './ChatMessage';
import { SuggestedPrompts } from './SuggestedPrompts';
import useAppStore from '@/store';

export function AIChatPanel() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const files = useAppStore((s) => s.files);
  const selectedFile = selectedFileId
    ? files.find((f) => f.id === selectedFileId) ?? null
    : null;

  const { messages, isLoading, isFetchingMessages, sendMessage, clearChat } =
    useAIChat({ projectId: selectedProjectId });

  const [input, setInput] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const content = input.trim();
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Build file context if a file is selected
    const fileContext = selectedFile
      ? {
          name: selectedFile.name,
          path: selectedFile.file_path,
          type: selectedFile.file_type,
        }
      : undefined;

    await sendMessage(content, fileContext);
  }, [input, isLoading, sendMessage, selectedFile]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      setInput(prompt);
      textareaRef.current?.focus();
    },
    []
  );

  // Retry a failed AI message by re-sending the previous user message
  const handleRetry = useCallback(
    (errorMessageId: string) => {
      // Find the error message index, then look for the user message before it
      const idx = messages.findIndex((m) => m.id === errorMessageId);
      if (idx <= 0) return;

      // Walk backwards to find the nearest user message
      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          const userMsg = messages[i];
          const fileContext = userMsg.fileContext
            ? { name: userMsg.fileContext, path: '', type: null }
            : undefined;
          sendMessage(userMsg.content, fileContext);
          break;
        }
      }
    },
    [messages, sendMessage]
  );

  const isEmpty = messages.length === 0;

  if (!selectedProjectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <Sparkles className="h-6 w-6 text-surface-300 dark:text-surface-500" />
        <p className="mt-3 text-xs text-surface-400 dark:text-surface-500">
          Select a project to start chatting with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto" role="log" aria-live="polite" aria-label="Chat messages">
        {isFetchingMessages && isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-surface-400" />
          </div>
        ) : isEmpty ? (
          <div className="flex h-full flex-col">
            {/* Welcome section */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-900/30">
                <Sparkles className="h-6 w-6 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
                AI Legal Assistant
              </h3>
              <p className="mt-1.5 mb-6 max-w-xs text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500">
                Ask questions about your documents, get case analysis, or
                request help with legal research.
              </p>

              {/* Suggested prompts */}
              <SuggestedPrompts onSelectPrompt={handlePromptSelect} />
            </div>
          </div>
        ) : (
          <div className="py-2">
            {/* Clear chat button */}
            <div className="flex justify-end px-4 pb-1">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>

            {/* Messages */}
            {messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} onRetry={handleRetry} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start px-4 py-2">
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/40">
                    <Sparkles className="h-3.5 w-3.5 text-accent-600 dark:text-accent-400" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm ring-1 ring-surface-200/80 dark:bg-surface-800 dark:ring-surface-700/50">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-400 [animation-delay:0ms]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-400 [animation-delay:150ms]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-surface-200 p-3 dark:border-surface-700">
        {/* File context indicator */}
        {selectedFile && (
          <div className="mb-2 flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1.5 dark:bg-primary-900/20">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
            <span className="truncate text-[10px] text-primary-600 dark:text-primary-400">
              Analyzing: {selectedFile.name}
            </span>
          </div>
        )}

        <div
          className={cn(
            'flex items-end gap-2 rounded-xl border p-2 transition-all',
            'border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-800',
            'focus-within:border-accent-300 focus-within:ring-2 focus-within:ring-accent-100 focus-within:shadow-md dark:focus-within:border-accent-600 dark:focus-within:ring-accent-900/30'
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask about your case..."
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-[13px] text-surface-700 placeholder:text-surface-400 focus:outline-none disabled:opacity-50 dark:text-surface-200 dark:placeholder:text-surface-500"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all',
              input.trim() && !isLoading
                ? 'bg-accent-600 text-white shadow-sm shadow-accent-500/25 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-500/30 active:scale-95'
                : 'bg-surface-200 text-surface-400 dark:bg-surface-700 dark:text-surface-500'
            )}
            title="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[10px] text-surface-400 dark:text-surface-500">
            <kbd className="rounded border border-surface-200 px-1 py-px font-mono text-[9px] dark:border-surface-700">Enter</kbd> to send
            <span className="mx-1 text-surface-300 dark:text-surface-600">/</span>
            <kbd className="rounded border border-surface-200 px-1 py-px font-mono text-[9px] dark:border-surface-700">Shift+Enter</kbd> new line
          </span>
          <span className={cn(
            'text-[10px]',
            input.length > 3600
              ? 'text-red-500 dark:text-red-400'
              : input.length > 3200
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-surface-400 dark:text-surface-500'
          )}>
            {input.length > 0 ? `${input.length.toLocaleString()} / 4,000` : 'Not legal advice'}
          </span>
        </div>
      </div>

      {/* Clear chat confirmation */}
      <ConfirmDialog
        open={showClearConfirm}
        title="Clear Conversation"
        message="This will permanently delete all messages in this conversation. This action cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={() => {
          clearChat();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

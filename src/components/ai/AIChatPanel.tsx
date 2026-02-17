import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Trash2, Loader2, FileText, FileImage, FileAudio, FileVideo, File, X, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ExportButton } from '@/components/shared/ExportButton';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatMessageComponent } from './ChatMessage';
import { SuggestedPrompts } from './SuggestedPrompts';
import { EffortSelector } from './EffortSelector';
import { FollowUpSuggestions } from './FollowUpSuggestions';
import useAppStore from '@/store';
import type { EffortLevel } from '@/types';

export function AIChatPanel() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const files = useAppStore((s) => s.files);
  const selectedFile = selectedFileId
    ? files.find((f) => f.id === selectedFileId) ?? null
    : null;

  const { messages, isLoading, isFetchingMessages, sendMessage, clearChat, latestFollowUps } =
    useAIChat({ projectId: selectedProjectId });

  const [input, setInput] = useState('');
  const [effort, setEffort] = useState<EffortLevel>('standard');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userHasScrolledRef = useRef(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [panelWidth, setPanelWidth] = useState(0);

  // Smart auto-scroll: only scroll if user hasn't manually scrolled up
  useEffect(() => {
    if (!userHasScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowJumpToLatest(true);
    }
  }, [messages, isLoading]);

  // Detect manual scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
      if (isNearBottom) {
        userHasScrolledRef.current = false;
        setShowJumpToLatest(false);
      } else {
        userHasScrolledRef.current = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Track panel width to switch to compact layouts when the panel is narrow.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const update = () => setPanelWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  const jumpToLatest = useCallback(() => {
    userHasScrolledRef.current = false;
    setShowJumpToLatest(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSend = useCallback(async (messageContent?: string) => {
    const content = (messageContent ?? input).trim();
    if (!content || isLoading) return;

    // Reset scroll tracking on new message
    userHasScrolledRef.current = false;
    setShowJumpToLatest(false);

    if (!messageContent) {
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    const fileContext = selectedFile
      ? {
          name: selectedFile.name,
          path: selectedFile.file_path,
          type: selectedFile.file_type,
        }
      : undefined;

    await sendMessage(content, fileContext, effort);
  }, [input, isLoading, sendMessage, selectedFile, effort]);

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

  const handleFollowUpSelect = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  // Retry a failed AI message by re-sending the previous user message
  const handleRetry = useCallback(
    (errorMessageId: string) => {
      const idx = messages.findIndex((m) => m.id === errorMessageId);
      if (idx <= 0) return;

      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          const userMsg = messages[i];
          const fileContext = userMsg.fileContext
            ? { name: userMsg.fileContext, path: '', type: null }
            : undefined;
          sendMessage(userMsg.content, fileContext, effort);
          break;
        }
      }
    },
    [messages, sendMessage, effort]
  );

  const isEmpty = messages.length === 0;
  const narrow = panelWidth > 0 && panelWidth < 320;
  const compact = panelWidth > 0 && panelWidth < 250;

  // Loading label based on effort
  const loadingLabel = effort === 'deep'
    ? 'Thinking with GPT-5.2...'
    : effort === 'quick'
      ? 'Generating with Gemini...'
      : 'Generating...';

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
    <div ref={panelRef} className="flex h-full min-w-0 flex-col">
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="relative flex-1 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {isFetchingMessages && isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-surface-400" />
          </div>
        ) : isEmpty ? (
          <div className="flex h-full flex-col">
            {/* Welcome section */}
            <div className={cn('flex flex-1 flex-col items-center justify-center pb-4', narrow ? 'px-3' : 'px-6')}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-900/30">
                <Sparkles className="h-6 w-6 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
                AI Legal Assistant
              </h3>
              <p className={cn('mt-1.5 mb-6 text-center text-xs leading-relaxed text-surface-400 dark:text-surface-500', compact ? 'max-w-[12rem]' : 'max-w-xs')}>
                Ask questions about your documents, get case analysis, or
                request help with legal research.
              </p>

              {/* Suggested prompts -- adapt to selected file */}
              <SuggestedPrompts
                onSelectPrompt={handlePromptSelect}
                selectedFileType={selectedFile?.file_type}
                selectedFileName={selectedFile?.name}
                compact={narrow}
              />
            </div>
          </div>
        ) : (
          <div className="py-2">
            {/* Chat actions: export + clear */}
            <div className="flex justify-end gap-1 px-4 pb-1">
              <ExportButton
                content=""
                title="AI Chat Conversation"
                type="chat"
                chatMessages={messages.map((m) => ({
                  role: m.role,
                  content: m.content,
                  model: m.model,
                  timestamp: m.timestamp,
                }))}
                className="text-[10px] py-1 px-2"
              />
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>

            {/* Messages */}
            {messages.map((msg, idx) => (
              <ChatMessageComponent
                key={msg.id}
                message={msg}
                onRetry={handleRetry}
                isLatest={idx === messages.length - 1}
                onFollowUpSelect={handleFollowUpSelect}
              />
            ))}

            {/* Follow-up suggestions (below last message, only when not loading) */}
            {!isLoading && latestFollowUps.length > 0 && (
              <div className="px-4 pb-2 pl-[52px]">
                <FollowUpSuggestions
                  suggestions={latestFollowUps}
                  onSelect={handleFollowUpSelect}
                />
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start px-4 py-2">
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/40">
                    <Sparkles className="h-3.5 w-3.5 text-accent-600 dark:text-accent-400" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm ring-1 ring-surface-200/80 dark:bg-surface-800 dark:ring-surface-700/50">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-400 [animation-delay:0ms]" />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-400 [animation-delay:150ms]" />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-400 [animation-delay:300ms]" />
                      </div>
                      <span className="text-[10px] text-surface-400">{loadingLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Jump to latest pill */}
        {showJumpToLatest && (
          <button
            onClick={jumpToLatest}
            className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-[11px] font-medium text-surface-600 shadow-md transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          >
            <ArrowDown className="h-3 w-3" />
            Jump to latest
          </button>
        )}
      </div>

      {/* Input area */}
      <div className={cn('shrink-0 border-t border-surface-200 dark:border-surface-700', compact ? 'p-2' : 'p-3')}>
        {/* File context indicator */}
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 dark:border-primary-800/50 dark:bg-primary-900/20">
            <FileContextIcon type={selectedFile.file_type} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-primary-700 dark:text-primary-300">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-primary-500/70 dark:text-primary-400/60">
                AI responses will reference this file
              </p>
            </div>
            <button
              onClick={() => useAppStore.getState().setSelectedFile(null)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-primary-400 transition-colors hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-800/50 dark:hover:text-primary-300"
              title="Clear file context"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Effort selector */}
        <div className="mb-2">
          <EffortSelector value={effort} onChange={setEffort} variant={narrow ? 'compact' : 'full'} wrap={!narrow} />
        </div>

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
            placeholder={compact ? 'Ask...' : 'Ask about your case...'}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-[13px] text-surface-700 placeholder:text-surface-400 focus:outline-none disabled:opacity-50 dark:text-surface-200 dark:placeholder:text-surface-500"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSend()}
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

        <div className={cn('mt-2 flex flex-wrap items-center gap-1 px-1', compact ? 'justify-end' : 'justify-between')}>
          {!compact && (
            <span className="text-[10px] text-surface-400 dark:text-surface-500">
              <kbd className="rounded border border-surface-200 px-1 py-px font-mono text-[9px] dark:border-surface-700">Enter</kbd> to send
              <span className="mx-1 text-surface-300 dark:text-surface-600">/</span>
              <kbd className="rounded border border-surface-200 px-1 py-px font-mono text-[9px] dark:border-surface-700">Shift+Enter</kbd> new line
            </span>
          )}
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

/* -- File context icon by type -- */

function FileContextIcon({ type }: { type: string | null }) {
  const iconClass = 'h-4 w-4';
  switch (type) {
    case 'pdf':
      return <FileText className={cn(iconClass, 'text-red-500')} />;
    case 'image':
      return <FileImage className={cn(iconClass, 'text-blue-500')} />;
    case 'audio':
      return <FileAudio className={cn(iconClass, 'text-purple-500')} />;
    case 'video':
      return <FileVideo className={cn(iconClass, 'text-pink-500')} />;
    default:
      return <File className={cn(iconClass, 'text-primary-500')} />;
  }
}

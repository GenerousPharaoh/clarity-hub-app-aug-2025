import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatMessageComponent } from './ChatMessage';
import { SuggestedPrompts } from './SuggestedPrompts';
import useAppStore from '@/store';

export function AIChatPanel() {
  const { messages, isLoading, sendMessage, clearChat } = useAIChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedFileId = useAppStore((s) => s.selectedFileId);
  const files = useAppStore((s) => s.files);
  const selectedFile = selectedFileId
    ? files.find((f) => f.id === selectedFileId) ?? null
    : null;

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
      ? `Currently viewing file: "${selectedFile.name}" (type: ${selectedFile.file_type || 'unknown'})`
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
      // Focus textarea after selecting a prompt
      textareaRef.current?.focus();
    },
    []
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
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
                onClick={clearChat}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>

            {/* Messages */}
            {messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start px-4 py-2">
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/40">
                    <Sparkles className="h-3.5 w-3.5 text-accent-600 dark:text-accent-400" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm ring-1 ring-surface-200/60 dark:bg-surface-700 dark:ring-surface-600/60">
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
              Context: {selectedFile.name}
            </span>
          </div>
        )}

        <div
          className={cn(
            'flex items-end gap-2 rounded-xl border p-2 transition-colors',
            'border-surface-200 bg-surface-50 dark:border-surface-600 dark:bg-surface-900',
            'focus-within:border-accent-300 focus-within:ring-2 focus-within:ring-accent-100 dark:focus-within:border-accent-600 dark:focus-within:ring-accent-900/30'
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
                ? 'bg-accent-600 text-white hover:bg-accent-700 active:scale-95'
                : 'bg-surface-200 text-surface-400 dark:bg-surface-700 dark:text-surface-500'
            )}
            title="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-surface-400 dark:text-surface-500">
          AI responses are for informational purposes only and do not constitute
          legal advice.
        </p>
      </div>
    </div>
  );
}

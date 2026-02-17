import { useState, useCallback, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { aiRouter, EFFORT_CONFIG } from '@/services/aiRouter';
import { searchDocuments, formatSearchContext } from '@/services/documentSearchService';
import { EffortSelector } from '@/components/ai/EffortSelector';
import useAppStore from '@/store';
import type { EffortLevel } from '@/types';
import type { ModelChoice } from '@/services/aiRouter';
import {
  Sparkles,
  Wand2,
  Minimize2,
  Maximize2,
  CheckCircle2,
  SpellCheck,
  Scale,
  FileText,
  X,
  Loader2,
  Check,
  RotateCcw,
  Send,
} from 'lucide-react';

interface AIWritingMenuProps {
  editor: Editor;
  onClose: () => void;
}

type AIAction =
  | 'improve'
  | 'shorter'
  | 'longer'
  | 'grammar'
  | 'professional'
  | 'casual'
  | 'legal'
  | 'summarize';

const AI_ACTIONS: { key: AIAction; label: string; icon: React.ReactNode; prompt: string }[] = [
  {
    key: 'improve',
    label: 'Improve Writing',
    icon: <Wand2 className="h-4 w-4" />,
    prompt: 'Improve the following text. Make it clearer, more concise, and better structured while preserving the original meaning. Return only the improved text, no explanations.',
  },
  {
    key: 'shorter',
    label: 'Make Shorter',
    icon: <Minimize2 className="h-4 w-4" />,
    prompt: 'Make the following text shorter and more concise while preserving the key points. Return only the shortened text, no explanations.',
  },
  {
    key: 'longer',
    label: 'Make Longer',
    icon: <Maximize2 className="h-4 w-4" />,
    prompt: 'Expand the following text with more detail and elaboration while maintaining the same tone and style. Return only the expanded text, no explanations.',
  },
  {
    key: 'grammar',
    label: 'Fix Grammar',
    icon: <SpellCheck className="h-4 w-4" />,
    prompt: 'Fix all grammar, spelling, and punctuation errors in the following text. Preserve the original meaning and style. Return only the corrected text, no explanations.',
  },
  {
    key: 'professional',
    label: 'Professional Tone',
    icon: <CheckCircle2 className="h-4 w-4" />,
    prompt: 'Rewrite the following text in a professional, formal tone suitable for business or legal communication. Return only the rewritten text, no explanations.',
  },
  {
    key: 'casual',
    label: 'Casual Tone',
    icon: <Sparkles className="h-4 w-4" />,
    prompt: 'Rewrite the following text in a casual, conversational tone. Return only the rewritten text, no explanations.',
  },
  {
    key: 'legal',
    label: 'Legal Tone',
    icon: <Scale className="h-4 w-4" />,
    prompt: 'Rewrite the following text in precise legal language suitable for legal documents or submissions. Use proper legal terminology. Return only the rewritten text, no explanations.',
  },
  {
    key: 'summarize',
    label: 'Summarize',
    icon: <FileText className="h-4 w-4" />,
    prompt: 'Summarize the following text into a concise summary capturing the key points. Return only the summary, no explanations.',
  },
];

const MODEL_LABELS: Record<ModelChoice, string> = {
  gemini: 'Gemini',
  gpt: 'GPT-5.2',
};

const EFFORT_BADGE_STYLES: Record<EffortLevel, string> = {
  quick: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300',
  standard: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  thorough: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  deep: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
};

export function AIWritingMenu({ editor, onClose }: AIWritingMenuProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [effort, setEffort] = useState<EffortLevel>('standard');
  const [customPrompt, setCustomPrompt] = useState('');
  const [resultModel, setResultModel] = useState<ModelChoice | null>(null);
  const [resultEffort, setResultEffort] = useState<EffortLevel | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const projectId = useAppStore((s) => s.selectedProjectId);

  const selectedText = editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    ' '
  );

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 80)}px`;
  }, [customPrompt]);

  const runPrompt = useCallback(
    async (promptText: string) => {
      if (!selectedText.trim()) {
        setError('Select some text first');
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);
      setResultModel(null);
      setResultEffort(null);

      try {
        // Optionally get document context for awareness
        let documentContext = '';
        if (projectId) {
          try {
            const searchResults = await searchDocuments({
              query: selectedText.slice(0, 200),
              projectId,
              limit: EFFORT_CONFIG[effort].chunkLimit,
            });
            if (searchResults.length > 0) {
              documentContext = formatSearchContext(searchResults);
            }
          } catch {
            // Non-critical
          }
        }

        const fullQuery = `${promptText}\n\nText:\n${selectedText}`;
        const routeResult = await aiRouter.routeQuery({
          query: fullQuery,
          effortLevel: effort,
          caseContext: documentContext || undefined,
        });

        setResult(routeResult.response);
        setResultModel(routeResult.model);
        setResultEffort(routeResult.effortLevel);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'AI request failed');
      } finally {
        setLoading(false);
      }
    },
    [selectedText, effort, projectId]
  );

  const handleSubmitCustom = useCallback(() => {
    if (!customPrompt.trim()) return;
    runPrompt(customPrompt.trim());
  }, [customPrompt, runPrompt]);

  const handleQuickAction = useCallback(
    (action: (typeof AI_ACTIONS)[number]) => {
      setCustomPrompt(action.prompt);
      runPrompt(action.prompt);
    },
    [runPrompt]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitCustom();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleSubmitCustom, onClose]
  );

  const acceptResult = useCallback(() => {
    if (!result) return;
    editor.chain().focus().deleteSelection().insertContent(result).run();
    onClose();
  }, [editor, result, onClose]);

  const rejectResult = useCallback(() => {
    setResult(null);
    setError(null);
    setResultModel(null);
    setResultEffort(null);
  }, []);

  const retryResult = useCallback(() => {
    setResult(null);
    setResultModel(null);
    setResultEffort(null);
    if (customPrompt.trim()) {
      runPrompt(customPrompt.trim());
    }
  }, [customPrompt, runPrompt]);

  // Loading label based on effort
  const loadingLabel = effort === 'deep'
    ? 'Thinking with GPT-5.2...'
    : effort === 'quick'
      ? 'Generating with Gemini...'
      : 'Generating...';

  return (
    <div className="absolute bottom-4 left-1/2 z-50 w-[420px] -translate-x-1/2 rounded-xl border border-surface-200 bg-white p-4 shadow-2xl dark:border-surface-700 dark:bg-surface-800">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-500" />
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">AI Writing</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Selected text preview */}
      {selectedText && !result && !loading && (
        <div className="mb-3 max-h-16 overflow-y-auto rounded-lg bg-surface-50 p-2.5 text-xs leading-relaxed text-surface-500 dark:bg-surface-700/50 dark:text-surface-400">
          {selectedText.length > 200 ? selectedText.slice(0, 200) + '...' : selectedText}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-6">
          <Loader2 className="h-4 w-4 animate-spin text-accent-500" />
          <span className="text-xs text-surface-500">{loadingLabel}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Result preview */}
      {result && !loading && (
        <div className="mb-3">
          {/* Model + effort badges */}
          {(resultModel || resultEffort) && (
            <div className="mb-2 flex items-center gap-1.5">
              {resultModel && (
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  resultModel === 'gpt'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                )}>
                  {MODEL_LABELS[resultModel]}
                </span>
              )}
              {resultEffort && (
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                  EFFORT_BADGE_STYLES[resultEffort]
                )}>
                  {resultEffort}
                </span>
              )}
            </div>
          )}

          <div className="max-h-32 overflow-y-auto rounded-lg bg-accent-50 p-3 text-xs leading-relaxed text-surface-700 dark:bg-accent-900/20 dark:text-surface-200">
            {result}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={acceptResult}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-700"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              onClick={retryResult}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-100 px-3 py-2 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
            <button
              onClick={rejectResult}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-100 px-3 py-2 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
            >
              <X className="h-3.5 w-3.5" />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Input + actions (hidden when showing result or loading) */}
      {!result && !loading && (
        <>
          {/* Custom prompt textarea */}
          <div className="mb-2 flex items-end gap-1.5 rounded-lg border border-surface-200 bg-white p-1.5 dark:border-surface-700 dark:bg-surface-800">
            <textarea
              ref={textareaRef}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask AI to edit this text..."
              className="flex-1 resize-none bg-transparent text-xs text-surface-700 placeholder:text-surface-400 focus:outline-none dark:text-surface-200 dark:placeholder:text-surface-500"
              style={{ minHeight: '36px', maxHeight: '80px' }}
            />
            <button
              onClick={handleSubmitCustom}
              disabled={!customPrompt.trim() || !selectedText.trim()}
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all',
                customPrompt.trim() && selectedText.trim()
                  ? 'bg-accent-600 text-white hover:bg-accent-700'
                  : 'bg-surface-100 text-surface-400 dark:bg-surface-700 dark:text-surface-500'
              )}
            >
              <Send className="h-3 w-3" />
            </button>
          </div>

          {/* Effort selector */}
          <div className="mb-2">
            <EffortSelector value={effort} onChange={setEffort} variant="compact" />
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-0.5">
            {AI_ACTIONS.map((action) => (
              <button
                key={action.key}
                onClick={() => handleQuickAction(action)}
                disabled={!selectedText.trim()}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors',
                  selectedText.trim()
                    ? 'text-surface-600 hover:bg-surface-100 hover:text-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 dark:hover:text-surface-100'
                    : 'cursor-not-allowed text-surface-300 dark:text-surface-500'
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400">
                  {action.icon}
                </div>
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

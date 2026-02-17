import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import geminiAI from '@/services/geminiAIService';
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

export function AIWritingMenu({ editor, onClose }: AIWritingMenuProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedText = editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    ' '
  );

  const runAction = useCallback(
    async (action: typeof AI_ACTIONS[number]) => {
      if (!selectedText.trim()) {
        setError('Select some text first');
        return;
      }

      if (!geminiAI.isAvailable()) {
        setError('AI is not configured. Set VITE_GEMINI_API_KEY.');
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await geminiAI.chatWithContext(
          `${action.prompt}\n\nText:\n${selectedText}`,
          [],
          []
        );
        setResult(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'AI request failed');
      } finally {
        setLoading(false);
      }
    },
    [selectedText]
  );

  const acceptResult = useCallback(() => {
    if (!result) return;
    editor.chain().focus().deleteSelection().insertContent(result).run();
    onClose();
  }, [editor, result, onClose]);

  const rejectResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="absolute bottom-4 left-1/2 z-50 w-96 -translate-x-1/2 rounded-xl border border-surface-200 bg-white p-4 shadow-2xl dark:border-surface-700 dark:bg-surface-800">
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
      {selectedText && !result && (
        <div className="mb-3 max-h-20 overflow-y-auto rounded-lg bg-surface-50 p-2.5 text-xs leading-relaxed text-surface-500 dark:bg-surface-700/50 dark:text-surface-400">
          {selectedText.length > 150 ? selectedText.slice(0, 150) + '...' : selectedText}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-6">
          <Loader2 className="h-4 w-4 animate-spin text-accent-500" />
          <span className="text-xs text-surface-500">Generating...</span>
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
              onClick={rejectResult}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-100 px-3 py-2 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Action buttons — single column list with icon boxes */}
      {!result && !loading && (
        <div className="flex flex-col gap-0.5">
          {AI_ACTIONS.map((action) => (
            <button
              key={action.key}
              onClick={() => runAction(action)}
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
      )}
    </div>
  );
}

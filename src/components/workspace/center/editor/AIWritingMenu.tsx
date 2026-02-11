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
    icon: <Wand2 className="h-3.5 w-3.5" />,
    prompt: 'Improve the following text. Make it clearer, more concise, and better structured while preserving the original meaning. Return only the improved text, no explanations.',
  },
  {
    key: 'shorter',
    label: 'Make Shorter',
    icon: <Minimize2 className="h-3.5 w-3.5" />,
    prompt: 'Make the following text shorter and more concise while preserving the key points. Return only the shortened text, no explanations.',
  },
  {
    key: 'longer',
    label: 'Make Longer',
    icon: <Maximize2 className="h-3.5 w-3.5" />,
    prompt: 'Expand the following text with more detail and elaboration while maintaining the same tone and style. Return only the expanded text, no explanations.',
  },
  {
    key: 'grammar',
    label: 'Fix Grammar',
    icon: <SpellCheck className="h-3.5 w-3.5" />,
    prompt: 'Fix all grammar, spelling, and punctuation errors in the following text. Preserve the original meaning and style. Return only the corrected text, no explanations.',
  },
  {
    key: 'professional',
    label: 'Professional Tone',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    prompt: 'Rewrite the following text in a professional, formal tone suitable for business or legal communication. Return only the rewritten text, no explanations.',
  },
  {
    key: 'casual',
    label: 'Casual Tone',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    prompt: 'Rewrite the following text in a casual, conversational tone. Return only the rewritten text, no explanations.',
  },
  {
    key: 'legal',
    label: 'Legal Tone',
    icon: <Scale className="h-3.5 w-3.5" />,
    prompt: 'Rewrite the following text in precise legal language suitable for legal documents or submissions. Use proper legal terminology. Return only the rewritten text, no explanations.',
  },
  {
    key: 'summarize',
    label: 'Summarize',
    icon: <FileText className="h-3.5 w-3.5" />,
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
    <div className="fixed inset-x-0 bottom-20 z-50 mx-auto w-80 rounded-xl border border-surface-200 bg-white p-3 shadow-2xl dark:border-surface-700 dark:bg-surface-800">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent-500" />
          <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">AI Writing</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Selected text preview */}
      {selectedText && !result && (
        <div className="mb-2 max-h-16 overflow-y-auto rounded-md bg-surface-50 p-2 text-[11px] leading-relaxed text-surface-500 dark:bg-surface-700/50 dark:text-surface-400">
          {selectedText.length > 120 ? selectedText.slice(0, 120) + '...' : selectedText}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-accent-500" />
          <span className="text-xs text-surface-500">Generating...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-2 rounded-md bg-red-50 p-2 text-[11px] text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Result preview */}
      {result && !loading && (
        <div className="mb-2">
          <div className="max-h-32 overflow-y-auto rounded-md bg-accent-50 p-2 text-xs leading-relaxed text-surface-700 dark:bg-accent-900/20 dark:text-surface-200">
            {result}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={acceptResult}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-primary-700"
            >
              <Check className="h-3 w-3" />
              Accept
            </button>
            <button
              onClick={rejectResult}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-surface-100 px-3 py-1.5 text-[11px] font-medium text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
            >
              <RotateCcw className="h-3 w-3" />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!result && !loading && (
        <div className="grid grid-cols-2 gap-1">
          {AI_ACTIONS.map((action) => (
            <button
              key={action.key}
              onClick={() => runAction(action)}
              disabled={!selectedText.trim()}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors',
                selectedText.trim()
                  ? 'text-surface-600 hover:bg-surface-100 hover:text-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 dark:hover:text-surface-100'
                  : 'cursor-not-allowed text-surface-300 dark:text-surface-500'
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { SaveStatus } from './hooks/useAutoSave';

interface EditorStatusBarProps {
  editor: Editor;
  saveStatus: SaveStatus;
}

export function EditorStatusBar({ editor, saveStatus }: EditorStatusBarProps) {
  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const wordCount = editor.storage.characterCount?.words() ?? 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex h-7 shrink-0 items-center justify-between border-t border-surface-200 bg-surface-50/50 px-4 dark:border-surface-800 dark:bg-surface-850/50">
      <div className="flex items-center gap-3">
        <span className="text-[10px] tabular-nums text-surface-400 dark:text-surface-500">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <span className="text-[10px] tabular-nums text-surface-400 dark:text-surface-500">
          {charCount} {charCount === 1 ? 'char' : 'chars'}
        </span>
        <span className="text-[10px] text-surface-400 dark:text-surface-500">
          {readingTime} min read
        </span>
      </div>
      <div
        className={cn(
          'flex items-center gap-1 text-[10px] font-medium transition-colors duration-200',
          saveStatus === 'error'
            ? 'text-red-500 dark:text-red-400'
            : saveStatus === 'saved'
              ? 'text-green-500 dark:text-green-400'
              : 'text-surface-400 dark:text-surface-500'
        )}
      >
        {saveStatus === 'saving' && (
          <>
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            Saving...
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <Check className="h-2.5 w-2.5" />
            Saved
          </>
        )}
        {saveStatus === 'error' && (
          <>
            <AlertCircle className="h-2.5 w-2.5" />
            Save failed
          </>
        )}
      </div>
    </div>
  );
}

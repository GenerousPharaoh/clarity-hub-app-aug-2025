import type { Editor } from '@tiptap/react';
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
    <div className="flex h-6 shrink-0 items-center justify-between border-t border-surface-100 px-4 dark:border-surface-700">
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-surface-400 dark:text-surface-500">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <span className="text-[10px] text-surface-400 dark:text-surface-500">
          {charCount} {charCount === 1 ? 'char' : 'chars'}
        </span>
        <span className="text-[10px] text-surface-400 dark:text-surface-500">
          {readingTime} min read
        </span>
      </div>
      <span className="text-[10px] font-medium text-surface-400 dark:text-surface-500">
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && 'Saved'}
      </span>
    </div>
  );
}

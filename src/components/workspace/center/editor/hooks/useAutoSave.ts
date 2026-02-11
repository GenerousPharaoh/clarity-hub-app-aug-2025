import { useRef, useState, useCallback } from 'react';
import { useUpdateNote } from '@/hooks/useNotes';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(noteId: string, projectId: string) {
  const updateNote = useUpdateNote();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContent = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const triggerSave = useCallback(
    (content: string) => {
      setSaveStatus('saving');
      pendingContent.current = content;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        pendingContent.current = null;
        updateNote.mutate(
          { id: noteId, projectId, content },
          {
            onSuccess: () => setSaveStatus('saved'),
            onError: () => setSaveStatus('error'),
          }
        );
      }, 1000);
    },
    [noteId, projectId, updateNote]
  );

  // Cleanup: flush any pending content immediately on unmount
  const cleanup = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    // Save unsaved content immediately instead of discarding it
    if (pendingContent.current !== null) {
      updateNote.mutate(
        { id: noteId, projectId, content: pendingContent.current },
      );
      pendingContent.current = null;
    }
  }, [noteId, projectId, updateNote]);

  return { saveStatus, triggerSave, cleanup };
}

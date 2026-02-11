import { useRef, useState, useCallback } from 'react';
import { useUpdateNote } from '@/hooks/useNotes';

export type SaveStatus = 'idle' | 'saving' | 'saved';

export function useAutoSave(noteId: string, projectId: string) {
  const updateNote = useUpdateNote();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const triggerSave = useCallback(
    (content: string) => {
      setSaveStatus('saving');

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        updateNote.mutate(
          { id: noteId, projectId, content },
          {
            onSuccess: () => setSaveStatus('saved'),
            onError: () => setSaveStatus('idle'),
          }
        );
      }, 1000);
    },
    [noteId, projectId, updateNote]
  );

  // Cleanup function to be called on unmount
  const cleanup = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  return { saveStatus, triggerSave, cleanup };
}

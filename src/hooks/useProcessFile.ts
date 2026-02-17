import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ProcessFileState {
  isProcessing: boolean;
  error: string | null;
}

/**
 * Hook for manually triggering file processing via the serverless endpoint.
 * Polls the file's processing_status until it completes.
 */
export function useProcessFile() {
  const [states, setStates] = useState<Record<string, ProcessFileState>>({});
  const queryClient = useQueryClient();
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const processFile = useCallback(
    async (fileId: string, projectId: string) => {
      // Set processing state
      setStates((prev) => ({
        ...prev,
        [fileId]: { isProcessing: true, error: null },
      }));

      try {
        // Get the user's session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        // Call the serverless processing endpoint
        const response = await fetch('/api/process-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ fileId, projectId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Processing failed');
        }

        // Invalidate file queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['files', projectId] });

        setStates((prev) => ({
          ...prev,
          [fileId]: { isProcessing: false, error: null },
        }));

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Processing failed';
        setStates((prev) => ({
          ...prev,
          [fileId]: { isProcessing: false, error: errorMsg },
        }));
        throw error;
      }
    },
    [queryClient]
  );

  const getState = useCallback(
    (fileId: string): ProcessFileState => {
      return states[fileId] || { isProcessing: false, error: null };
    },
    [states]
  );

  // Cleanup polling on unmount
  const cleanup = useCallback(() => {
    Object.values(pollingRefs.current).forEach(clearInterval);
    pollingRefs.current = {};
  }, []);

  return { processFile, getState, cleanup };
}

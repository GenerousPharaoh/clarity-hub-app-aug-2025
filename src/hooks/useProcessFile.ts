import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { checkProcessingBudget, reserveProcessingBudget } from '@/lib/processingBudget';
import type { FileRecord } from '@/types';
import { filesQueryKey } from './useFiles';
import useAppStore from '@/store';

interface ProcessFileState {
  isProcessing: boolean;
  error: string | null;
}

interface ProcessFileOptions {
  fileSizeBytes?: number;
  source?: 'manual' | 'auto';
}

interface ProcessFileResponse {
  status?: 'completed' | 'failed';
  chunksCreated?: number;
  summary?: string | null;
  error?: string;
}

const inFlightProcessingRequests = new Map<string, Promise<ProcessFileResponse>>();

function updateCachedFile(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  fileId: string,
  updater: (file: FileRecord) => FileRecord
) {
  queryClient.setQueryData<FileRecord[]>(
    filesQueryKey(projectId),
    (current) => current?.map((file) => (file.id === fileId ? updater(file) : file)) ?? current
  );
}

async function parseProcessFileResponse(response: Response): Promise<ProcessFileResponse> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as ProcessFileResponse;
  }

  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as ProcessFileResponse;
  } catch {
    return { error: text };
  }
}

/**
 * Hook for triggering the canonical server-side processing pipeline.
 * Uses the shared files query cache so status changes are reflected across the app immediately.
 */
export function useProcessFile() {
  const [states, setStates] = useState<Record<string, ProcessFileState>>({});
  const queryClient = useQueryClient();

  const processFile = useCallback(
    async (fileId: string, projectId: string, options?: ProcessFileOptions) => {
      // PIPEDA compliance: block processing when user has disabled AI features
      if (!useAppStore.getState().aiEnabled) {
        toast.info('AI features are disabled. Enable them in Settings to process files.');
        return { status: 'failed' as const, error: 'AI features are disabled' };
      }

      const requestKey = `${projectId}:${fileId}`;
      const inFlightRequest = inFlightProcessingRequests.get(requestKey);
      if (inFlightRequest) {
        return inFlightRequest;
      }

      const request = (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        const budget = checkProcessingBudget(options?.fileSizeBytes);
        if (!budget.allowed) {
          throw new Error(budget.reason || 'Daily processing budget reached');
        }

        setStates((prev) => ({
          ...prev,
          [fileId]: { isProcessing: true, error: null },
        }));
        updateCachedFile(queryClient, projectId, fileId, (file) => ({
          ...file,
          processing_status: 'processing',
          processing_error: null,
        }));

        const response = await fetch('/api/process-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ fileId, projectId }),
        });

        const result = await parseProcessFileResponse(response);

        if (!response.ok || result.status !== 'completed') {
          throw new Error(result.error || 'Processing failed');
        }

        reserveProcessingBudget(options?.fileSizeBytes);

        updateCachedFile(queryClient, projectId, fileId, (file) => ({
          ...file,
          processing_status: 'completed',
          processing_error: null,
          processed_at: new Date().toISOString(),
          ai_summary: result.summary ?? null,
          chunk_count: result.chunksCreated ?? 0,
        }));
        void queryClient.invalidateQueries({ queryKey: filesQueryKey(projectId) });
        // Timeline events are extracted during file processing — refresh the timeline
        void queryClient.invalidateQueries({ queryKey: ['timeline-events', projectId] });

        setStates((prev) => ({
          ...prev,
          [fileId]: { isProcessing: false, error: null },
        }));

        return result;
      })()
        .catch((error) => {
          const errorMsg = error instanceof Error ? error.message : 'Processing failed';
          updateCachedFile(queryClient, projectId, fileId, (file) => ({
            ...file,
            processing_status: 'failed',
            processing_error: errorMsg,
          }));
          setStates((prev) => ({
            ...prev,
            [fileId]: { isProcessing: false, error: errorMsg },
          }));
          void queryClient.invalidateQueries({ queryKey: filesQueryKey(projectId) });
          throw error;
        })
        .finally(() => {
          inFlightProcessingRequests.delete(requestKey);
        });

      inFlightProcessingRequests.set(requestKey, request);
      return request;
    },
    [queryClient]
  );

  const getState = useCallback(
    (fileId: string): ProcessFileState => {
      return states[fileId] || { isProcessing: false, error: null };
    },
    [states]
  );

  return { processFile, getState };
}

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { aiRouter } from '@/services/aiRouter';
import { downloadFile } from '@/services/storageService';
import { searchDocuments, formatSearchContext, type SearchResult } from '@/services/documentSearchService';
import type { ChatMessage, ChatSource } from '@/types';
import type { TablesInsert } from '@/types/database';

const CHAT_KEY = 'chat-messages';

function chatKey(projectId: string | null) {
  return [CHAT_KEY, projectId] as const;
}

/** Convert a DB row into the UI ChatMessage shape. */
function rowToMessage(row: {
  id: string;
  role: string;
  content: string;
  model: string | null;
  file_context: string | null;
  created_at: string | null;
  sources?: unknown;
  complexity?: string | null;
}): ChatMessage {
  return {
    id: row.id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    model: (row.model as 'gemini' | 'gpt') ?? undefined,
    timestamp: row.created_at ? new Date(row.created_at) : new Date(),
    fileContext: row.file_context ?? undefined,
    sources: (row.sources as ChatSource[] | undefined) ?? undefined,
    complexity: row.complexity ?? undefined,
  };
}

/** Convert search results into ChatSource objects. */
function searchResultsToSources(results: SearchResult[]): ChatSource[] {
  return results.map((r, i) => ({
    sourceIndex: i + 1,
    chunkId: r.chunkId,
    fileId: r.fileId,
    fileName: r.sourceFileName,
    fileType: r.sourceFileType,
    pageNumber: r.pageNumber,
    sectionHeading: r.sectionHeading,
    contentPreview: r.content.slice(0, 200),
    timestampStart: r.timestampStart,
  }));
}

/**
 * Fetch text content from a file stored in Supabase Storage.
 * For text-based files, returns the raw text (truncated to ~30K chars).
 * For images/PDFs, returns a description string so the AI knows what it is.
 */
async function fetchFileContent(
  filePath: string,
  fileType: string | null,
  fileName: string
): Promise<string> {
  try {
    const blob = await downloadFile(filePath);
    const type = fileType?.toLowerCase() || '';

    // Text-based files: extract raw text
    if (
      type.includes('text') ||
      type.includes('csv') ||
      type.includes('json') ||
      type.includes('xml') ||
      type.includes('html') ||
      fileName.match(/\.(txt|md|csv|json|xml|html|log|yml|yaml|toml|ini|cfg|js|ts|jsx|tsx|css|py)$/i)
    ) {
      const text = await blob.text();
      if (text.length > 30000) {
        return text.slice(0, 30000) + '\n\n[Content truncated at 30,000 characters]';
      }
      return text;
    }

    // PDF: return base64 for multimodal AI
    if (type.includes('pdf') || fileName.match(/\.pdf$/i)) {
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      if (base64.length > 500000) {
        return `[PDF file: "${fileName}" — too large for inline analysis. Size: ${Math.round(blob.size / 1024)}KB]`;
      }
      return `[PDF file: "${fileName}" — base64 content follows]\n${base64}`;
    }

    // Images: return base64 for multimodal AI
    if (type.includes('image') || fileName.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i)) {
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const mimeType = blob.type || 'image/png';
      if (base64.length > 500000) {
        return `[Image file: "${fileName}" — too large for inline analysis. Size: ${Math.round(blob.size / 1024)}KB]`;
      }
      return `[Image file: "${fileName}" — ${mimeType} base64 content follows]\n${base64}`;
    }

    // Other file types: just note what it is
    return `[File: "${fileName}" (type: ${type || 'unknown'}) — binary file, content not extractable as text]`;
  } catch (err) {
    return `[Could not read file "${fileName}": ${err instanceof Error ? err.message : 'unknown error'}]`;
  }
}

/** Convert an AI error into an actionable user-facing message. */
function formatAIError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  const msg = error.message.toLowerCase();

  // API key issues
  if (msg.includes('api key') || msg.includes('api_key') || msg.includes('unauthorized') || msg.includes('401')) {
    return 'API key error — the AI service rejected the request. Please check that your API keys are configured correctly in Settings.';
  }

  // Rate limiting
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('quota')) {
    return 'Rate limit reached — the AI service is temporarily throttled. Please wait a moment and try again.';
  }

  // Network errors
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('econnrefused')) {
    return 'Network error — could not reach the AI service. Please check your internet connection and try again.';
  }

  // Model-specific errors
  if (msg.includes('model') && (msg.includes('not found') || msg.includes('does not exist'))) {
    return 'Model unavailable — the requested AI model could not be found. This may be a temporary issue.';
  }

  // Content safety
  if (msg.includes('safety') || msg.includes('blocked') || msg.includes('content filter')) {
    return 'The AI service flagged this request. Please try rephrasing your question.';
  }

  // Generic with original message
  return `AI error: ${error.message}`;
}

interface UseAIChatOptions {
  projectId: string | null;
}

interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isFetchingMessages: boolean;
  sendMessage: (
    content: string,
    fileContext?: { name: string; path: string; type: string | null }
  ) => Promise<void>;
  clearChat: () => void;
}

export function useAIChat({ projectId }: UseAIChatOptions): UseAIChatReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const abortRef = useRef(false);

  // Fetch persisted messages from Supabase
  const { data: messages = [], isLoading: isFetchingMessages } = useQuery<ChatMessage[]>({
    queryKey: chatKey(projectId),
    queryFn: async () => {
      if (!projectId || !user) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(rowToMessage);
    },
    enabled: !!projectId && !!user,
  });

  // Mutation: insert a message row
  const insertMessage = useMutation({
    mutationFn: async (input: TablesInsert<'chat_messages'>) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Track loading state for the AI response cycle
  const isLoadingRef = useRef(false);

  // Monotonically increasing counter for unique loading IDs
  const loadingIdCounter = useRef(0);

  const sendMessage = useCallback(
    async (
      content: string,
      fileContext?: { name: string; path: string; type: string | null }
    ) => {
      if (!content.trim() || !projectId || !user || isLoadingRef.current) return;

      abortRef.current = false;
      isLoadingRef.current = true;

      // Build file context string
      let fileContextStr: string | undefined;
      let enrichedContext: string | undefined;

      if (fileContext) {
        fileContextStr = `File: "${fileContext.name}" (type: ${fileContext.type || 'unknown'})`;
        // Fetch actual file content for the AI
        const fileContent = await fetchFileContent(
          fileContext.path,
          fileContext.type,
          fileContext.name
        );
        enrichedContext = `${fileContextStr}\n\n--- FILE CONTENT ---\n${fileContent}\n--- END FILE CONTENT ---`;
      }

      // Unique loading indicator ID
      const loadingId = `loading_${++loadingIdCounter.current}`;

      try {
        // 1. Insert user message into DB
        const userRow = await insertMessage.mutateAsync({
          project_id: projectId,
          role: 'user',
          content: content.trim(),
          file_context: fileContextStr ?? null,
        });

        // Optimistically add to cache
        const userMsg = rowToMessage(userRow);
        queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), (old) => [
          ...(old ?? []),
          userMsg,
        ]);

        // Add a temporary loading indicator
        queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), (old) => [
          ...(old ?? []),
          {
            id: loadingId,
            role: 'assistant' as const,
            content: '__loading__',
            timestamp: new Date(),
          },
        ]);

        // Search processed documents for relevant context
        let documentContext = '';
        let sources: ChatSource[] = [];
        try {
          const searchResults = await searchDocuments({
            query: content.trim(),
            projectId,
          });
          if (searchResults.length > 0) {
            documentContext = formatSearchContext(searchResults);
            sources = searchResultsToSources(searchResults);
          }
        } catch {
          // Non-critical: proceed without search context
        }

        // Build conversation history from cache (avoids stale closure)
        const currentMessages = queryClient.getQueryData<ChatMessage[]>(chatKey(projectId)) ?? [];
        const conversationHistory = currentMessages
          .filter((m) => m.content !== '__loading__')
          .map((m) => ({ role: m.role, content: m.content }));

        // Combine file context with document search context
        const fullContext = [enrichedContext || fileContextStr, documentContext]
          .filter(Boolean)
          .join('\n');

        const result = await aiRouter.routeQuery({
          query: content.trim(),
          conversationHistory,
          caseContext: fullContext || undefined,
          sources: sources.length > 0 ? sources : undefined,
        });

        if (abortRef.current) return;

        // 2. Insert assistant message into DB
        const assistantRow = await insertMessage.mutateAsync({
          project_id: projectId,
          role: 'assistant',
          content: result.response,
          model: result.model,
          file_context: null,
          sources: sources.length > 0 ? JSON.parse(JSON.stringify(sources)) : null,
          complexity: result.complexity,
        });

        // Remove loading indicator and add real response
        const assistantMsg = rowToMessage(assistantRow);
        queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), (old) =>
          (old ?? []).filter((m) => m.id !== loadingId).concat(assistantMsg)
        );
      } catch (error) {
        if (abortRef.current) return;

        const errorContent = formatAIError(error);

        // Try to insert error message into DB; if that also fails, just update cache
        try {
          const errorRow = await insertMessage.mutateAsync({
            project_id: projectId,
            role: 'assistant',
            content: errorContent,
            model: 'gemini',
            file_context: null,
          });

          const errorMsg = rowToMessage(errorRow);
          queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), (old) =>
            (old ?? []).filter((m) => m.id !== loadingId).concat(errorMsg)
          );
        } catch {
          // DB insert also failed — just remove the loading indicator and show error in cache only
          queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), (old) =>
            (old ?? []).filter((m) => m.id !== loadingId).concat({
              id: `error_${loadingIdCounter.current}`,
              role: 'assistant' as const,
              content: errorContent,
              timestamp: new Date(),
            })
          );
        }
      } finally {
        isLoadingRef.current = false;
        queryClient.invalidateQueries({ queryKey: chatKey(projectId) });
      }
    },
    [projectId, user, insertMessage, queryClient]
  );

  const clearChat = useCallback(async () => {
    if (!projectId) return;
    abortRef.current = true;
    isLoadingRef.current = false;

    // Delete all messages for this project
    await supabase.from('chat_messages').delete().eq('project_id', projectId);

    // Clear cache
    queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), []);
    queryClient.invalidateQueries({ queryKey: chatKey(projectId) });
  }, [projectId, queryClient]);

  // Derive isLoading from whether there's a loading placeholder in messages
  const isLoading = messages.some((m) => m.content === '__loading__');

  return { messages: messages.filter((m) => m.content !== '__loading__'), isLoading, isFetchingMessages, sendMessage, clearChat };
}

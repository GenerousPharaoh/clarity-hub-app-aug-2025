import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { aiRouter, EFFORT_CONFIG } from '@/services/aiRouter';
import { downloadFile } from '@/services/storageService';
import { searchDocuments, formatSearchContext, type SearchResult } from '@/services/documentSearchService';
import type { ChatMessage, ChatSource, EffortLevel } from '@/types';
import type { TablesInsert } from '@/types/database';
import { getDemoFiles, getDemoProjects } from '@/lib/demo';

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
  effort_level?: string | null;
  follow_ups?: unknown;
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
    effortLevel: (row.effort_level as EffortLevel) ?? undefined,
    followUps: (row.follow_ups as string[]) ?? undefined,
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
 * Fetch text content from a file for AI context.
 *
 * For processed files (PDFs, images, audio/video): uses the extracted text
 * stored in the `files` table by the document processing pipeline (Mistral OCR
 * or GPT-4.1 vision). This is structured text the AI can actually understand.
 *
 * For text-based files: reads raw text from storage directly.
 * For images (unprocessed): falls back to base64 for multimodal AI.
 */
async function fetchFileContent(
  filePath: string,
  fileType: string | null,
  fileName: string
): Promise<string> {
  try {
    const type = fileType?.toLowerCase() || '';

    // For file types that go through the processing pipeline (PDF, image, audio, video),
    // use the extracted text from the database — not the raw binary.
    const isProcessedType =
      type.includes('pdf') || fileName.match(/\.pdf$/i) ||
      type.includes('image') || fileName.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff)$/i) ||
      type.includes('audio') || type.includes('video');

    if (isProcessedType) {
      const { data: fileRecord } = await supabase
        .from('files')
        .select('extracted_text, processing_status, ai_summary')
        .eq('file_path', filePath)
        .single();

      // Use extracted text if the file has been processed
      if (fileRecord?.extracted_text) {
        const text = fileRecord.extracted_text;
        const summary = fileRecord.ai_summary
          ? `\nAI Summary: ${fileRecord.ai_summary}\n`
          : '';
        const header = `Extracted text from "${fileName}":${summary}\n`;
        if (text.length > 30000) {
          return header + text.slice(0, 30000) + '\n\n[Content truncated at 30,000 characters]';
        }
        return header + text;
      }

      // File not processed — for images, fall back to base64 multimodal
      if (type.includes('image') || fileName.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i)) {
        const blob = await downloadFile(filePath);
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

      // PDF/audio/video not processed — tell the user
      return `[File "${fileName}" has not been processed yet. Click the process button on this file to extract its text content, then try again.]`;
    }

    // Text-based files: read raw text from storage directly
    const blob = await downloadFile(filePath);
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

function buildDemoReply(params: {
  projectId: string;
  content: string;
  effortLevel: EffortLevel;
  fileContext?: { name: string; path: string; type: string | null };
}): {
  content: string;
  followUps: string[];
} {
  const lower = params.content.toLowerCase();
  const project = getDemoProjects().find((entry) => entry.id === params.projectId) ?? null;
  const projectFiles = getDemoFiles(params.projectId);
  const selectedFile = params.fileContext
    ? projectFiles.find(
        (file) =>
          file.name === params.fileContext?.name ||
          file.file_path === params.fileContext?.path
      ) ?? null
    : null;

  if (selectedFile && /(summary|summari|explain|what is this|document)/.test(lower)) {
    return {
      content: `Demo review of "${selectedFile.name}": ${selectedFile.ai_summary ?? 'This file has already been pre-processed in the demo workspace.'}\n\nOpen the viewer tab to inspect the source directly, then ask a narrower question if you want to pressure-test a fact pattern or chronology.`,
      followUps: [
        'What is the strongest fact in this file?',
        'How would you use this as an exhibit?',
        'What follow-up evidence should I look for next?',
      ],
    };
  }

  if (project && /(strategy|next step|argument|claim|position|risk)/.test(lower)) {
    return {
      content: `Demo strategy pass for "${project.name}":\n\n1. Build a tight chronology from the seeded files and note edits.\n2. Promote the clearest documentary support into exhibits before drafting argument.\n3. Use the notes tab to isolate the two or three facts that change leverage.\n\nThis demo assistant is local-only, so treat it as a workflow guide rather than a legal opinion.`,
      followUps: [
        'Which seeded file should become Exhibit A?',
        'What should the chronology highlight first?',
        'How should I structure the demand or complaint theory?',
      ],
    };
  }

  if (project && /(timeline|chronology|dates|when|sequence)/.test(lower)) {
    return {
      content: `For "${project.name}", start with the dated documents in the viewer and the project note in the Documents tab. The goal is to reduce the file to a sequence of event, response, and consequence.\n\nIn demo mode, the best next move is to open the note and turn it into a short chronology with one bullet per date.`,
      followUps: [
        'Which document gives the cleanest opening date?',
        'What dates are still missing from the record?',
        'How should I rewrite the chronology note?',
      ],
    };
  }

  return {
    content: `Demo mode is active, so this assistant stays local to the seeded workspace. You can still use it to explore the product flow: select a file, open the viewer, edit notes, add exhibits, and then ask for a summary, chronology, or strategy pass based on the sample matter.`,
    followUps: [
      'Summarize the selected file',
      'Suggest the next workflow step',
      'Help me organize this project into exhibits',
    ],
  };
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
    fileContext?: { name: string; path: string; type: string | null },
    effortLevel?: EffortLevel
  ) => Promise<void>;
  clearChat: () => void;
  latestFollowUps: string[];
}

export function useAIChat({ projectId }: UseAIChatOptions): UseAIChatReturn {
  const { user, isDemoMode } = useAuth();
  const queryClient = useQueryClient();
  const abortRef = useRef(false);

  // Fetch persisted messages from Supabase
  const { data: messages = [], isLoading: isFetchingMessages } = useQuery<ChatMessage[]>({
    queryKey: chatKey(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      if (isDemoMode) {
        return queryClient.getQueryData<ChatMessage[]>(chatKey(projectId)) ?? [];
      }
      if (!user) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(rowToMessage);
    },
    enabled: !!projectId && (isDemoMode || !!user),
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
      fileContext?: { name: string; path: string; type: string | null },
      effortLevel?: EffortLevel
    ) => {
      if (!content.trim() || !projectId || !user || isLoadingRef.current) return;

      abortRef.current = false;
      isLoadingRef.current = true;
      const effort = effortLevel ?? 'standard';
      const basicFileContext = fileContext
        ? `File: "${fileContext.name}" (type: ${fileContext.type || 'unknown'})`
        : undefined;

      // Unique loading indicator ID
      const loadingId = `loading_${++loadingIdCounter.current}`;

      if (isDemoMode) {
        const userMsg: ChatMessage = {
          id: `demo_user_${Date.now()}`,
          role: 'user',
          content: content.trim(),
          timestamp: new Date(),
          fileContext: basicFileContext,
        };

        queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), (old) => [
          ...(old ?? []),
          userMsg,
          {
            id: loadingId,
            role: 'assistant',
            content: '__loading__',
            timestamp: new Date(),
          },
        ]);

        try {
          await new Promise((resolve) => window.setTimeout(resolve, 250));

          const demoReply = buildDemoReply({
            projectId,
            content,
            effortLevel: effort,
            fileContext,
          });

          queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), (old) =>
            (old ?? []).filter((message) => message.id !== loadingId).concat({
              id: `demo_assistant_${Date.now()}`,
              role: 'assistant',
              content: demoReply.content,
              model: 'gpt',
              timestamp: new Date(),
              effortLevel: effort,
              followUps: demoReply.followUps,
            })
          );
        } finally {
          isLoadingRef.current = false;
        }

        return;
      }

      // Build file context string
      let fileContextStr: string | undefined;
      let enrichedContext: string | undefined;

      if (fileContext) {
        fileContextStr = basicFileContext;
        // Fetch actual file content for the AI
        const fileContent = await fetchFileContent(
          fileContext.path,
          fileContext.type,
          fileContext.name
        );
        enrichedContext = `${fileContextStr}\n\n--- FILE CONTENT ---\n${fileContent}\n--- END FILE CONTENT ---`;
      }

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

        // Run document search and legal context building in parallel
        const chunkLimit = EFFORT_CONFIG[effort].chunkLimit;
        let documentContext = '';
        let sources: ChatSource[] = [];
        let legalContext = '';

        const docSearchPromise = searchDocuments({
          query: content.trim(),
          projectId,
          limit: chunkLimit,
        }).catch(() => [] as SearchResult[]);

        const legalContextPromise = aiRouter.buildLegalContext(content.trim(), effort)
          .catch(() => '');

        const [searchResults, legalCtx] = await Promise.all([docSearchPromise, legalContextPromise]);

        if (searchResults.length > 0) {
          documentContext = formatSearchContext(searchResults);
          sources = searchResultsToSources(searchResults);
        }
        legalContext = legalCtx;

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
          effortLevel: effort,
          conversationHistory,
          caseContext: fullContext || undefined,
          sources: sources.length > 0 ? sources : undefined,
          legalContext,
        });

        if (abortRef.current) return;

        // Follow-ups are now returned by the server-side /api/ai-chat endpoint
        const followUps = result.followUps ?? [];

        // 2. Insert assistant message into DB
        const assistantRow = await insertMessage.mutateAsync({
          project_id: projectId,
          role: 'assistant',
          content: result.response,
          model: result.model,
          file_context: null,
          sources: sources.length > 0 ? JSON.parse(JSON.stringify(sources)) : null,
          complexity: result.complexity,
          effort_level: effort,
          follow_ups: followUps.length > 0 ? followUps : null,
        });

        // Remove loading indicator and add real response with effort + follow-ups
        const assistantMsg: ChatMessage = {
          ...rowToMessage(assistantRow),
          effortLevel: effort,
          followUps: followUps.length > 0 ? followUps : undefined,
        };
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
            model: null,
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
    [projectId, user, insertMessage, isDemoMode, queryClient]
  );

  const clearChat = useCallback(async () => {
    if (!projectId) return;
    abortRef.current = true;
    isLoadingRef.current = false;

    if (isDemoMode) {
      queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), []);
      return;
    }

    // Delete all messages for this project
    try {
      await supabase.from('chat_messages').delete().eq('project_id', projectId);
    } catch (err) {
      console.error('Failed to delete chat messages:', err);
    }

    // Clear cache
    queryClient.setQueryData<ChatMessage[]>(chatKey(projectId), []);
    queryClient.invalidateQueries({ queryKey: chatKey(projectId) });
  }, [projectId, isDemoMode, queryClient]);

  // Derive isLoading from whether there's a loading placeholder in messages
  const isLoading = messages.some((m) => m.content === '__loading__');
  const filteredMessages = messages.filter((m) => m.content !== '__loading__');

  // Extract follow-ups from the most recent assistant message
  const lastAssistant = [...filteredMessages].reverse().find((m) => m.role === 'assistant');
  const latestFollowUps = lastAssistant?.followUps ?? [];

  return { messages: filteredMessages, isLoading, isFetchingMessages, sendMessage, clearChat, latestFollowUps };
}

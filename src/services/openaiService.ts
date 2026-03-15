/**
 * OpenAI Service - DEPRECATED CLIENT-SIDE STUB
 *
 * All AI calls now go through server-side API routes:
 * - /api/ai-chat (GPT-5.2 deep legal reasoning)
 * - /api/ai-embeddings (text-embedding-3-small)
 *
 * This file is kept as a minimal stub to avoid breaking any imports
 * that may still reference the old interface. No API keys are used.
 */

// ============================================================
// Types (preserved for backward compatibility)
// ============================================================

export interface DeepReasoningResponse {
  content: string;
  citations: string[];
  reasoning_summary?: string;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================
// Stub Service
// ============================================================

class OpenAIService {
  /**
   * Always returns false since AI calls now go through the server.
   * The server-side route checks availability internally.
   */
  isAvailable(): boolean {
    // API keys are server-side only now.
    // Return false so the router doesn't try to call methods directly.
    return false;
  }

  async deepLegalReasoning(_params: {
    query: string;
    legalContext: string;
    caseContext?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    reasoningEffort?: 'low' | 'medium' | 'high';
    maxCompletionTokens?: number;
  }): Promise<DeepReasoningResponse> {
    throw new Error(
      'Direct OpenAI calls are disabled. Use aiRouter.routeQuery() which calls /api/ai-chat server-side.'
    );
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    throw new Error(
      'Direct embedding calls are disabled. Use aiRouter.generateEmbedding() which calls /api/ai-embeddings server-side.'
    );
  }

  async generateEmbeddings(_texts: string[]): Promise<number[][]> {
    throw new Error(
      'Direct embedding calls are disabled. Use aiRouter.generateEmbeddings() which calls /api/ai-embeddings server-side.'
    );
  }
}

export const openaiService = new OpenAIService();
export default openaiService;

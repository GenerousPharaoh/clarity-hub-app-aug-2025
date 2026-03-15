/**
 * AI Router - Smart Model Selection
 *
 * Routes queries to the optimal AI model via server-side API routes:
 * - /api/ai-chat: Gemini 2.5 Flash or GPT-5.2 depending on query complexity
 * - /api/ai-embeddings: OpenAI text-embedding-3-small for RAG vector search
 *
 * API keys are stored server-side only. The client sends the Supabase JWT
 * for authentication.
 */
import { supabase } from '@/lib/supabase';
import { legalKnowledge } from './legalKnowledgeService';
import type { EffortLevel } from '@/types';

// ============================================================
// Types
// ============================================================

export type QueryComplexity = 'simple' | 'moderate' | 'deep';
export type ModelChoice = 'gemini' | 'gpt';

// ============================================================
// Effort Configuration
// ============================================================

export const EFFORT_CONFIG: Record<EffortLevel, {
  reasoning: 'low' | 'medium' | 'high' | undefined;
  maxTokens: number;
  chunkLimit: number;
}> = {
  quick:    { reasoning: undefined, maxTokens: 1500, chunkLimit: 5 },
  standard: { reasoning: 'low',    maxTokens: 2000, chunkLimit: 8 },
  thorough: { reasoning: 'medium', maxTokens: 3000, chunkLimit: 12 },
  deep:     { reasoning: 'high',   maxTokens: 4000, chunkLimit: 15 },
};

// Keywords/patterns that signal deep legal reasoning is needed
const DEEP_REASONING_SIGNALS = [
  // Legal strategy
  'strategy', 'advise', 'recommend', 'should i', 'what are my options',
  'pros and cons', 'risks', 'liability', 'exposure',
  // Complex legal analysis
  'analyze', 'analysis', 'compare', 'distinguish', 'apply the test',
  'legal test', 'factors', 'elements', 'standard',
  // Case-specific reasoning
  'reasonable notice', 'just cause', 'constructive dismissal', 'duty to mitigate',
  'termination clause', 'enforceability', 'severance calculation',
  'damages', 'bad faith', 'moral damages', 'punitive',
  // Multi-step reasoning
  'how would a court', 'what would happen if', 'is there a case',
  'precedent', 'what does the law say', 'legal basis',
  'argue', 'defence', 'defense', 'counter-argument',
];

// ============================================================
// Citation Extraction (shared across models)
// ============================================================

/**
 * Extract Canadian legal citations from AI response text.
 * Shared by both GPT and Gemini code paths.
 */
export function extractCitations(text: string): string[] {
  const citations: string[] = [];

  const patterns = [
    /\d{4}\s+(?:SCC|ONCA|ONSC|BCCA|ABCA|CanLII)\s+\d+/g,
    /\[\d{4}\]\s+\d+\s+(?:SCR|OR|OJ)\s+(?:No\s+)?\d+/g,
    /(?:R\.S\.O\.|S\.O\.|R\.S\.C\.)\s+\d{4},\s+c\.\s+[\w.-]+/g,
    /O\.\s*Reg\.\s*\d+\/\d+/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) citations.push(...matches);
  }

  return [...new Set(citations)];
}

// ============================================================
// Auth helper
// ============================================================

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated. Please sign in to use AI features.');
  }
  return session.access_token;
}

// ============================================================
// Service
// ============================================================

class AIRouter {
  /**
   * Classify query complexity to pick the right model.
   * Runs client-side for instant UX feedback (no API key needed).
   */
  classifyQuery(query: string): QueryComplexity {
    const lower = query.toLowerCase();
    const wordCount = query.split(/\s+/).length;

    // Check deep reasoning signals FIRST, regardless of word count
    const signalCount = DEEP_REASONING_SIGNALS.filter((s) => lower.includes(s)).length;

    if (signalCount >= 2) return 'deep';
    if (signalCount === 1 && wordCount > 15) return 'deep';
    if (signalCount === 1) return 'moderate';

    // No signals matched — use word count as a tiebreaker
    if (wordCount > 30) return 'moderate';
    if (wordCount < 8) return 'simple';

    return 'simple';
  }

  /**
   * Build legal knowledge context from the RAG pipeline.
   * Exposed so callers can run it in parallel with other async work.
   * Queries Supabase directly (uses anon key with RLS) — no API key needed.
   */
  async buildLegalContext(query: string, effort: EffortLevel): Promise<string> {
    if (effort === 'quick') return '';
    return legalKnowledge.buildLegalContext(query);
  }

  /**
   * Route a legal query to the best model via the server-side /api/ai-chat endpoint.
   * Accepts an optional effort level to control reasoning depth and model selection.
   * If `legalContext` is provided it is used directly; otherwise it is built internally.
   */
  async routeQuery(params: {
    query: string;
    effortLevel?: EffortLevel;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    caseContext?: string;
    sources?: Array<{ sourceIndex: number; fileName: string; pageNumber: number | null; sectionHeading: string | null }>;
    legalContext?: string;
  }): Promise<{
    response: string;
    model: ModelChoice;
    complexity: QueryComplexity;
    citations: string[];
    effortLevel: EffortLevel;
    followUps?: string[];
  }> {
    const effort = params.effortLevel ?? 'standard';
    const complexity = this.classifyQuery(params.query);

    // Use pre-built legal context if provided, otherwise build it now
    const legalContext = params.legalContext ?? (effort === 'quick' ? '' : await legalKnowledge.buildLegalContext(params.query));

    const token = await getAccessToken();

    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: params.query,
        conversationHistory: params.conversationHistory,
        legalContext,
        caseContext: params.caseContext,
        effortLevel: effort,
        documentSources: params.sources,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorBody.error || `AI request failed with status ${response.status}`);
    }

    const result = await response.json();

    return {
      response: result.response,
      model: result.model || 'gemini',
      complexity,
      citations: result.citations || [],
      effortLevel: result.effortLevel || effort,
      followUps: result.followUps,
    };
  }

  /**
   * Generate follow-up question suggestions.
   * Now handled server-side inside /api/ai-chat, so this is a no-op
   * that returns empty. The follow-ups come back in routeQuery's result.
   */
  async generateFollowUps(_query: string, _response: string): Promise<string[]> {
    // Follow-ups are now generated server-side in /api/ai-chat
    return [];
  }

  /**
   * Generate embeddings via the server-side /api/ai-embeddings endpoint.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const token = await getAccessToken();

      const response = await fetch('/api/ai-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('Embedding request failed:', response.status);
        return [];
      }

      const result = await response.json();
      return result.embedding ?? [];
    } catch (err) {
      console.error('Embedding generation failed:', err);
      return [];
    }
  }

  /**
   * Batch generate embeddings via the server-side /api/ai-embeddings endpoint.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const token = await getAccessToken();

      const response = await fetch('/api/ai-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        console.error('Batch embedding request failed:', response.status);
        return [];
      }

      const result = await response.json();
      return result.embeddings ?? [];
    } catch (err) {
      console.error('Batch embedding generation failed:', err);
      return [];
    }
  }
}

export const aiRouter = new AIRouter();
export default aiRouter;

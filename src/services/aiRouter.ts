/**
 * AI Router - Smart Model Selection
 *
 * Routes queries to the optimal AI model:
 * - Gemini 3.0 Pro: multimodal processing, general chat, document analysis
 * - GPT-5.2: deep legal reasoning, complex analysis, strategy questions
 * - OpenAI embeddings: RAG vector search (text-embedding-3-small)
 *
 * Falls back gracefully if a model isn't configured.
 */
import { geminiAI } from './geminiAIService';
import { openaiService } from './openaiService';
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
// Service
// ============================================================

class AIRouter {
  /**
   * Classify query complexity to pick the right model.
   */
  classifyQuery(query: string): QueryComplexity {
    const lower = query.toLowerCase();
    const wordCount = query.split(/\s+/).length;

    // Short simple questions -> simple
    if (wordCount < 8 && !DEEP_REASONING_SIGNALS.some((s) => lower.includes(s))) {
      return 'simple';
    }

    // Check for deep reasoning signals
    const signalCount = DEEP_REASONING_SIGNALS.filter((s) => lower.includes(s)).length;

    if (signalCount >= 2) return 'deep';
    if (signalCount === 1 && wordCount > 15) return 'deep';
    if (signalCount === 1) return 'moderate';

    // Long, detailed questions are likely moderate+
    if (wordCount > 30) return 'moderate';

    return 'simple';
  }

  /**
   * Pick the best available model for the query.
   */
  selectModel(complexity: QueryComplexity): ModelChoice {
    // If GPT is available and query is complex, use it
    if (complexity === 'deep' && openaiService.isAvailable()) {
      return 'gpt';
    }

    // Everything else goes to Gemini (or GPT as fallback)
    if (geminiAI.isAvailable()) return 'gemini';
    if (openaiService.isAvailable()) return 'gpt';

    // Neither available
    throw new Error(
      'No AI model configured. Set VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY.'
    );
  }

  /**
   * Route a legal query to the best model with full context.
   * Accepts an optional effort level to control reasoning depth and model selection.
   */
  async routeQuery(params: {
    query: string;
    effortLevel?: EffortLevel;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    caseContext?: string;
    sources?: Array<{ sourceIndex: number; fileName: string; pageNumber: number | null; sectionHeading: string | null }>;
  }): Promise<{
    response: string;
    model: ModelChoice;
    complexity: QueryComplexity;
    citations: string[];
    effortLevel: EffortLevel;
  }> {
    const effort = params.effortLevel ?? 'standard';
    const effortCfg = EFFORT_CONFIG[effort];
    const complexity = this.classifyQuery(params.query);

    // Effort-based model override: quick → always Gemini, deep → always GPT
    let model: ModelChoice;
    if (effort === 'quick') {
      model = geminiAI.isAvailable() ? 'gemini' : this.selectModel(complexity);
    } else if (effort === 'deep') {
      model = openaiService.isAvailable() ? 'gpt' : this.selectModel(complexity);
    } else {
      model = this.selectModel(complexity);
    }

    // Build legal knowledge context from the RAG pipeline (skip for quick)
    const legalContext = effort === 'quick' ? '' : await legalKnowledge.buildLegalContext(params.query);

    // Build citation instruction if sources are available
    const citationInstruction = params.sources && params.sources.length > 0
      ? '\n\nIMPORTANT: When referencing information from the provided document search results, cite them using [Source N] notation (e.g., [Source 1], [Source 2]). Each [Source N] corresponds to a specific document chunk provided in the context. Only cite sources that are actually relevant to your answer.'
      : '';

    if (model === 'gpt') {
      const result = await openaiService.deepLegalReasoning({
        query: params.query,
        legalContext: legalContext + citationInstruction,
        caseContext: params.caseContext,
        conversationHistory: params.conversationHistory,
        reasoningEffort: effortCfg.reasoning,
        maxCompletionTokens: effortCfg.maxTokens,
      });

      return {
        response: result.content,
        model: 'gpt',
        complexity,
        citations: result.citations,
        effortLevel: effort,
      };
    }

    // Gemini path
    const contextParts: string[] = [];
    if (legalContext) contextParts.push(legalContext + citationInstruction);
    if (params.caseContext) contextParts.push(params.caseContext);

    const response = await geminiAI.chatWithContext(
      params.query,
      contextParts,
      (params.conversationHistory ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      }))
    );

    return {
      response,
      model: 'gemini',
      complexity,
      citations: [],
      effortLevel: effort,
    };
  }

  /**
   * Generate follow-up question suggestions based on a Q&A exchange.
   * Uses Gemini with low token count for speed.
   */
  async generateFollowUps(query: string, response: string): Promise<string[]> {
    if (!geminiAI.isAvailable()) return [];

    try {
      const prompt = `Given this question and answer about a legal case, suggest 3 brief follow-up questions the user might ask next. Return only the 3 questions, one per line, no numbering or bullets.

Question: ${query.slice(0, 500)}

Answer: ${response.slice(0, 1000)}`;

      const result = await geminiAI.chatWithContext(prompt, [], []);
      return result
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && l.length < 120)
        .slice(0, 3);
    } catch {
      return [];
    }
  }

  /**
   * Generate embeddings using the best available provider.
   * Prefers OpenAI (1536-dim, cheaper, better for RAG) over Gemini (768-dim).
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (openaiService.isAvailable()) {
      return openaiService.generateEmbedding(text);
    }
    if (geminiAI.isAvailable()) {
      return geminiAI.generateEmbeddings(text);
    }
    return [];
  }

  /**
   * Batch generate embeddings.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (openaiService.isAvailable()) {
      return openaiService.generateEmbeddings(texts);
    }
    // Gemini doesn't support batch, so do them one by one
    if (geminiAI.isAvailable()) {
      const results: number[][] = [];
      for (const text of texts) {
        results.push(await geminiAI.generateEmbeddings(text));
      }
      return results;
    }
    return [];
  }
}

export const aiRouter = new AIRouter();
export default aiRouter;

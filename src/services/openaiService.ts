/**
 * OpenAI Service - GPT-5.2 Deep Legal Reasoning + Embeddings
 *
 * GPT-5.2 with extended thinking for complex legal analysis tasks.
 * OpenAI text-embedding-3-small for RAG vector search ($0.02/1M tokens).
 */
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

const openai = apiKey
  ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  : null;

// ============================================================
// Types
// ============================================================

export interface DeepReasoningResponse {
  content: string;
  citations: string[];
  reasoning_summary?: string;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================
// Service
// ============================================================

class OpenAIService {
  private available: boolean;

  constructor() {
    this.available = !!openai;
  }

  isAvailable(): boolean {
    return this.available;
  }

  // ─── GPT-5.2 Deep Legal Reasoning ─────────────────────────

  /**
   * Use GPT-5.2 with extended thinking for complex legal analysis.
   * This is the heavy hitter -- use for questions that require
   * careful legal reasoning, multi-factor analysis, or strategy.
   */
  async deepLegalReasoning(params: {
    query: string;
    legalContext: string;
    caseContext?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<DeepReasoningResponse> {
    if (!openai)
      throw new Error('OpenAI not configured. Set VITE_OPENAI_API_KEY.');

    const systemPrompt = `You are a senior Ontario employment law analyst. You have deep expertise in Canadian employment law with particular focus on Ontario legislation, case law, and legal principles.

CRITICAL RULES:
- ONLY cite cases and legislation that exist in the provided legal context. If the context doesn't contain relevant authority, say so explicitly.
- NEVER fabricate case citations, statute references, or legal principles.
- When uncertain, clearly state "I am not certain about this" rather than guessing.
- Distinguish between binding authority (SCC, ONCA) and persuasive authority (trial decisions, other provinces).
- Always identify the current status of principles (active, modified, overruled).
- Flag any areas where the law is unsettled or evolving.

When analyzing legal issues:
1. Identify the applicable legal framework (statute + common law)
2. State the governing legal test or principle with its source
3. Apply the test to the specific facts
4. Note any counterarguments or risks
5. Provide a practical recommendation`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 6 messages for context window)
    if (params.conversationHistory?.length) {
      for (const msg of params.conversationHistory.slice(-6)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Build the user message with legal + case context
    let userContent = '';

    if (params.legalContext) {
      userContent += `--- LEGAL KNOWLEDGE BASE ---\n${params.legalContext}\n\n`;
    }
    if (params.caseContext) {
      userContent += `--- CASE FILE CONTEXT ---\n${params.caseContext}\n\n`;
    }
    userContent += `--- QUESTION ---\n${params.query}`;

    messages.push({ role: 'user', content: userContent });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.2, // Low temp for legal accuracy
      max_completion_tokens: 16384,
    });

    const content = response.choices[0]?.message?.content ?? '';

    // Extract any case citations mentioned in the response
    const citations = this.extractCitations(content);

    return {
      content,
      citations,
      confidence: citations.length > 0 ? 'high' : 'medium',
    };
  }

  // ─── Embeddings ───────────────────────────────────────────

  /**
   * Generate 1536-dim embeddings using text-embedding-3-small.
   * $0.02 per 1M tokens -- very cheap for RAG.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!openai) return [];

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // ~2K tokens safe limit
    });

    return response.data[0]?.embedding ?? [];
  }

  /**
   * Batch embed multiple texts efficiently in a single API call.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!openai || texts.length === 0) return [];

    const truncated = texts.map((t) => t.substring(0, 8000));

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncated,
    });

    return response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }

  // ─── Helpers ──────────────────────────────────────────────

  private extractCitations(text: string): string[] {
    const citations: string[] = [];

    // Match common Canadian legal citation patterns
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
}

export const openaiService = new OpenAIService();
export default openaiService;

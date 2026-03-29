/**
 * Server-side embedding generation.
 * Primary: Voyage AI voyage-law-2 (1024 dimensions, legal-optimized)
 * Fallback: OpenAI text-embedding-3-small (1536 dimensions)
 *
 * IMPORTANT: When switching between providers the pgvector column dimension
 * must match — run the migration before deploying with a new provider.
 */

import OpenAI from 'openai';

// ─── Voyage AI ────────────────────────────────────────────────

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-law-2';
const VOYAGE_BATCH_SIZE = 128;
const VOYAGE_MAX_CHARS = 64_000; // ~16K tokens × 4 chars/token

// ─── OpenAI (fallback) ───────────────────────────────────────

const OPENAI_MODEL = 'text-embedding-3-small';
const OPENAI_BATCH_SIZE = 100;
const OPENAI_MAX_CHARS = 32_764; // ~8K tokens × 4 chars/token

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

function useVoyage(): boolean {
  return !!process.env.VOYAGE_API_KEY;
}

/** Returns the dimension of the active embedding provider. */
export function getEmbeddingDimension(): number {
  return useVoyage() ? 1024 : 1536;
}

/** Returns the active provider name. */
export function getEmbeddingProvider(): 'voyage' | 'openai' {
  return useVoyage() ? 'voyage' : 'openai';
}

function truncateForEmbedding(text: string, provider: 'voyage' | 'openai'): string {
  const limit = provider === 'voyage' ? VOYAGE_MAX_CHARS : OPENAI_MAX_CHARS;
  if (text.length <= limit) return text;
  return text.slice(0, limit);
}

// ─── Voyage AI calls ─────────────────────────────────────────

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { total_tokens: number };
}

async function voyageEmbed(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error('VOYAGE_API_KEY not set');

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Voyage AI embedding failed (${response.status}): ${errorBody}`);
  }

  const result: VoyageResponse = await response.json();
  return result.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// ─── OpenAI calls ─────────────────────────────────────────────

async function openaiEmbed(texts: string[]): Promise<number[][]> {
  const client = getOpenAIClient();
  if (!client) throw new Error('Neither VOYAGE_API_KEY nor OPENAI_API_KEY is set');

  const response = await client.embeddings.create({
    model: OPENAI_MODEL,
    input: texts,
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Generate embedding for a single text string.
 */
export async function embedText(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const provider = getEmbeddingProvider();
  const input = truncateForEmbedding(trimmed, provider);

  const results = provider === 'voyage'
    ? await voyageEmbed([input])
    : await openaiEmbed([input]);

  return results[0] ?? [];
}

/**
 * Generate embeddings for multiple texts in batches.
 * Handles empty texts by returning empty arrays at their indices.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const provider = getEmbeddingProvider();
  const batchSize = provider === 'voyage' ? VOYAGE_BATCH_SIZE : OPENAI_BATCH_SIZE;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    const prepared = slice.map((t) => truncateForEmbedding(t.trim(), provider));

    // Track which indices have content vs empty
    const nonEmptyIndices: number[] = [];
    const nonEmptyTexts: string[] = [];
    for (let j = 0; j < prepared.length; j++) {
      if (prepared[j].length > 0) {
        nonEmptyIndices.push(j);
        nonEmptyTexts.push(prepared[j]);
      }
    }

    if (nonEmptyTexts.length === 0) {
      for (let j = 0; j < slice.length; j++) results.push([]);
      continue;
    }

    const embeddings = provider === 'voyage'
      ? await voyageEmbed(nonEmptyTexts)
      : await openaiEmbed(nonEmptyTexts);

    // Map embeddings back to correct positions
    const embeddingMap = new Map<number, number[]>();
    for (let j = 0; j < embeddings.length; j++) {
      embeddingMap.set(nonEmptyIndices[j], embeddings[j]);
    }

    for (let j = 0; j < slice.length; j++) {
      results.push(embeddingMap.get(j) ?? []);
    }
  }

  return results;
}

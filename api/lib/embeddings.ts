/**
 * Server-side OpenAI embedding generation.
 * Uses text-embedding-3-small (1536 dimensions).
 */

import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 100;
const MAX_TOKEN_LENGTH = 8191; // Model max

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set');
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Truncate text to approximate token limit (rough 4 chars/token).
 */
function truncateForEmbedding(text: string): string {
  const charLimit = MAX_TOKEN_LENGTH * 4;
  if (text.length <= charLimit) return text;
  return text.slice(0, charLimit);
}

/**
 * Generate embedding for a single text string.
 */
export async function embedText(text: string): Promise<number[]> {
  const client = getClient();
  const input = truncateForEmbedding(text.trim());
  if (!input) return [];

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batches.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const client = getClient();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
      .map((t) => truncateForEmbedding(t.trim()))
      .filter((t) => t.length > 0);

    if (batch.length === 0) {
      // Fill with empty arrays for skipped entries
      for (let j = 0; j < Math.min(BATCH_SIZE, texts.length - i); j++) {
        results.push([]);
      }
      continue;
    }

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    for (const item of response.data) {
      results.push(item.embedding);
    }
  }

  return results;
}

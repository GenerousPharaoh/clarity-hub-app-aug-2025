/**
 * Vercel Serverless Function: AI Embeddings
 * POST /api/ai-embeddings
 *
 * Generates text embeddings server-side, keeping API keys out of the client bundle.
 * Uses Voyage AI voyage-law-2 (1024 dims) when configured, falls back to OpenAI (1536 dims).
 *
 * Body: { text: string } | { texts: string[] }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { embedText, embedBatch, getEmbeddingProvider, getEmbeddingDimension } from './_lib/embeddings.js';

// ============================================================
// CORS
// ============================================================

function isAllowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return origin;
    if (hostname.endsWith('.vercel.app')) return origin;
    if (hostname === 'clarity-hub-app.vercel.app') return origin;
  } catch {
    // Malformed origin
  }
  return null;
}

function getServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================================
// Handler
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const allowedOrigin = isAllowedOrigin(req.headers.origin as string | undefined);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // --- Auth ---
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.slice(7);
    const serviceClient = getServiceClient();
    if (!serviceClient) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }

    // --- Parse body ---
    const { text, texts } = req.body ?? {};

    // Support both single text and batch
    const isBatch = Array.isArray(texts) && texts.length > 0;
    const inputTexts: string[] = isBatch
      ? texts.map((t: unknown) => (typeof t === 'string' ? t : ''))
      : typeof text === 'string' && text.trim()
        ? [text]
        : [];

    if (inputTexts.length === 0) {
      return res.status(400).json({ error: 'text (string) or texts (string[]) is required' });
    }

    // Cap batch size at 100 to prevent abuse
    if (inputTexts.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 texts per batch request' });
    }

    // Use the shared embedding module (Voyage or OpenAI based on env)
    if (isBatch) {
      const embeddings = await embedBatch(inputTexts);
      return res.status(200).json({
        embeddings,
        provider: getEmbeddingProvider(),
        dimension: getEmbeddingDimension(),
      });
    }

    const embedding = await embedText(inputTexts[0]);
    return res.status(200).json({
      embedding,
      provider: getEmbeddingProvider(),
      dimension: getEmbeddingDimension(),
    });
  } catch (error) {
    console.error('AI embeddings error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export const config = {
  maxDuration: 30,
};

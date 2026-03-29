/**
 * Vercel Serverless Function: Rerank
 * POST /api/rerank
 *
 * Re-ranks document search results using Cohere Rerank for more precise retrieval.
 * Body: { query: string, documents: Array<{ id: string, content: string }>, topN?: number }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const COHERE_RERANK_URL = 'https://api.cohere.com/v2/rerank';
const COHERE_MODEL = 'rerank-english-v3.0';

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

interface RerankDocument {
  id: string;
  content: string;
}

interface CohereRerankResult {
  results: Array<{
    index: number;
    relevance_score: number;
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    // Auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.slice(7);
    const serviceClient = getServiceClient();
    if (!serviceClient) return res.status(500).json({ error: 'Server configuration error' });

    const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }

    // Parse body
    const { query, documents, topN = 10 } = req.body ?? {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' });
    }
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'documents array is required and must not be empty' });
    }

    const cohereApiKey = process.env.COHERE_API_KEY;
    if (!cohereApiKey) {
      // If Cohere not configured, return documents in original order
      return res.status(200).json({
        results: (documents as RerankDocument[]).slice(0, topN).map((doc, i) => ({
          id: doc.id,
          index: i,
          relevance_score: 1 - i * 0.01,
        })),
        reranked: false,
      });
    }

    // Call Cohere Rerank
    const cohereResponse = await fetch(COHERE_RERANK_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cohereApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: COHERE_MODEL,
        query,
        documents: (documents as RerankDocument[]).map((d) => d.content),
        top_n: Math.min(topN, documents.length),
      }),
    });

    if (!cohereResponse.ok) {
      const errorBody = await cohereResponse.text();
      console.error('Cohere rerank error:', errorBody);
      // Fallback: return original order
      return res.status(200).json({
        results: (documents as RerankDocument[]).slice(0, topN).map((doc, i) => ({
          id: doc.id,
          index: i,
          relevance_score: 1 - i * 0.01,
        })),
        reranked: false,
      });
    }

    const cohereResult: CohereRerankResult = await cohereResponse.json();

    const rerankedResults = cohereResult.results.map((r) => ({
      id: (documents as RerankDocument[])[r.index].id,
      index: r.index,
      relevance_score: r.relevance_score,
    }));

    return res.status(200).json({ results: rerankedResults, reranked: true });
  } catch (error) {
    console.error('Rerank error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export const config = { maxDuration: 15 };

/**
 * Vercel Serverless Function: Re-embed
 * POST /api/reembed
 *
 * Re-generates embeddings for all legal_knowledge_chunks using the current
 * embedding provider (Voyage AI voyage-law-2 or OpenAI fallback).
 * Used after switching embedding providers or dimensions.
 *
 * Body: { table?: 'legal_knowledge_chunks' | 'document_chunks' }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { embedBatch, getEmbeddingProvider, getEmbeddingDimension } from './_lib/embeddings.js';

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

    const { table = 'legal_knowledge_chunks' } = req.body ?? {};

    if (table !== 'legal_knowledge_chunks' && table !== 'document_chunks') {
      return res.status(400).json({ error: 'table must be legal_knowledge_chunks or document_chunks' });
    }

    // Fetch all rows that need embedding
    const { data: rows, error: fetchError } = await serviceClient
      .from(table)
      .select('id, content')
      .order('id');

    if (fetchError) {
      return res.status(500).json({ error: `Failed to fetch rows: ${fetchError.message}` });
    }

    if (!rows || rows.length === 0) {
      return res.status(200).json({ message: 'No rows to embed', count: 0 });
    }

    const provider = getEmbeddingProvider();
    const dimension = getEmbeddingDimension();

    // Generate embeddings in batches
    const texts = rows.map((r) => r.content || '');
    const embeddings = await embedBatch(texts);

    // Update each row with its new embedding
    let updated = 0;
    for (let i = 0; i < rows.length; i++) {
      const embedding = embeddings[i];
      if (!embedding || embedding.length === 0) continue;

      const { error: updateError } = await serviceClient
        .from(table)
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', rows[i].id);

      if (updateError) {
        console.error(`Failed to update row ${rows[i].id}:`, updateError.message);
      } else {
        updated++;
      }
    }

    return res.status(200).json({
      message: `Re-embedded ${updated}/${rows.length} rows`,
      table,
      provider,
      dimension,
      total: rows.length,
      updated,
    });
  } catch (error) {
    console.error('Re-embed error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export const config = { maxDuration: 300 }; // 5 minutes for large batches

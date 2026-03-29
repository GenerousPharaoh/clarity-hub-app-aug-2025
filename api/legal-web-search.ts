/**
 * Vercel Serverless Function: Legal Web Search
 * POST /api/legal-web-search
 *
 * Real-time web search via Tavily for recent case law, regulatory news,
 * and legal developments not yet in the static knowledge base.
 * Body: { query: string, searchDepth?: 'basic' | 'advanced', maxResults?: number }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

// Preferred Canadian legal sources
const LEGAL_DOMAINS = [
  'canlii.org',
  'ontario.ca',
  'laws-lois.justice.gc.ca',
  'ohrc.on.ca',
  'tribunalsontario.ca',
  'cpo.on.ca',
  'lso.ca',
  'scc-csc.ca',
];

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

    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      return res.status(503).json({ error: 'Tavily API key not configured' });
    }

    const { query, searchDepth = 'advanced', maxResults = 5 } = req.body ?? {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' });
    }

    // Focus search on Canadian legal sources
    const legalQuery = `${query.trim()} Ontario Canada law`;

    const tavilyResponse = await fetch(TAVILY_SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: legalQuery,
        search_depth: searchDepth,
        max_results: Math.min(maxResults, 10),
        include_domains: LEGAL_DOMAINS,
      }),
    });

    if (!tavilyResponse.ok) {
      const errorBody = await tavilyResponse.text();
      console.error('Tavily search error:', errorBody);
      return res.status(200).json({ results: [] });
    }

    const tavilyResult = await tavilyResponse.json();

    const results = (tavilyResult.results || []).map(
      (r: { title: string; url: string; content: string; score: number; published_date?: string }) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
        published_date: r.published_date,
      })
    );

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Legal web search error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export const config = { maxDuration: 30 };

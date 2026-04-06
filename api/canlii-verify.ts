/**
 * Vercel Serverless Function: Citation Verification via CanLII
 * POST /api/canlii-verify
 *
 * Accepts an array of legal citation strings, attempts to verify each against
 * the CanLII API, and returns verification status for each.
 *
 * Body: { citations: string[] }
 * Returns: { results: CitationVerification[] }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CitationVerification {
  citation: string;
  status: 'verified' | 'unverified' | 'not_found' | 'error';
  canliiUrl?: string;
  canliiTitle?: string;
  message?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CANLII_BASE = 'https://api.canlii.org/v1';
const MAX_CITATIONS = 15;
const BATCH_SIZE = 3;

/** Map neutral-citation court codes to CanLII database IDs. */
const COURT_DB_MAP: Record<string, string> = {
  scc: 'csc-scc',
  onca: 'onca',
  onsc: 'onsc',
  hrto: 'onhrt',
  canlii: 'onsc', // CanLII-numbered decisions are often ONSC; best-effort
  bcca: 'bcca',
  abca: 'abca',
};

/** Regex for neutral citations: "2024 ONCA 123" */
const NEUTRAL_CITE_RE = /(\d{4})\s+(SCC|ONCA|ONSC|HRTO|CanLII|BCCA|ABCA)\s+(\d+)/i;

/** Regex for legislation references */
const LEGISLATION_RE = /(?:R\.S\.O\.|S\.O\.|R\.S\.C\.|O\.\s*Reg\.)/i;

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

/** Sleep helper for rate limiting between batches. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt to verify a single citation against CanLII.
 */
async function verifyCitation(
  citation: string,
  apiKey: string
): Promise<CitationVerification> {
  // Check for legislation references first — we don't verify these via CanLII case browse
  if (LEGISLATION_RE.test(citation)) {
    return {
      citation,
      status: 'unverified',
      message: 'Legislation reference',
    };
  }

  // Try to parse as neutral citation
  const match = citation.match(NEUTRAL_CITE_RE);
  if (!match) {
    return {
      citation,
      status: 'unverified',
      message: 'Citation format not recognized for CanLII lookup',
    };
  }

  const year = match[1];
  const courtCode = match[2].toLowerCase();
  const decisionNum = match[3];

  const databaseId = COURT_DB_MAP[courtCode];
  if (!databaseId) {
    return {
      citation,
      status: 'unverified',
      message: `Court code "${match[2]}" not mapped to CanLII database`,
    };
  }

  // Build the CanLII case ID: e.g. "2024onca123"
  const caseId = `${year}${courtCode}${decisionNum}`;
  const url = `${CANLII_BASE}/caseBrowse/en/${databaseId}/${caseId}/?api_key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      const title = data.title || data.caseId?.en || citation;
      const canliiUrl = data.url || `https://www.canlii.org/en/${databaseId}/doc/${year}/${caseId}/${caseId}.html`;
      return {
        citation,
        status: 'verified',
        canliiTitle: title,
        canliiUrl,
      };
    }

    if (response.status === 404) {
      return {
        citation,
        status: 'not_found',
        message: 'Case not found in CanLII database',
      };
    }

    return {
      citation,
      status: 'error',
      message: `CanLII returned HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      citation,
      status: 'error',
      message: err instanceof Error ? err.message : 'Network error',
    };
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

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
    // Auth — same pattern as api/canlii.ts
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

    const apiKey = process.env.CANLII_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'CanLII API key not configured' });
    }

    // Validate body
    const { citations } = req.body ?? {};
    if (!Array.isArray(citations) || citations.length === 0) {
      return res.status(400).json({ error: 'citations must be a non-empty array of strings' });
    }

    // Cap at MAX_CITATIONS
    const trimmed = citations.slice(0, MAX_CITATIONS).filter(
      (c: unknown): c is string => typeof c === 'string' && c.trim().length > 0
    );

    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'No valid citation strings provided' });
    }

    // Process in batches of BATCH_SIZE to respect rate limits
    const results: CitationVerification[] = [];
    for (let i = 0; i < trimmed.length; i += BATCH_SIZE) {
      const batch = trimmed.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((cite) => verifyCitation(cite, apiKey))
      );
      results.push(...batchResults);

      // Small delay between batches (skip after last batch)
      if (i + BATCH_SIZE < trimmed.length) {
        await sleep(200);
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Citation verification error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export const config = { maxDuration: 30 };

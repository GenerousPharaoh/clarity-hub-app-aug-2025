/**
 * Vercel Serverless Function: CanLII API Proxy
 * POST /api/canlii
 *
 * Proxies requests to the CanLII REST API, keeping the API key server-side.
 * Body: { action: string, params: Record<string, string> }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CANLII_BASE = 'https://api.canlii.org/v1';

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

type CanliiAction =
  | 'listDatabases'
  | 'listCases'
  | 'getCaseMetadata'
  | 'getCitedCases'
  | 'getCitingCases'
  | 'getCitedLegislations'
  | 'listLegislationDatabases'
  | 'listLegislation'
  | 'getLegislationMetadata';

const VALID_ACTIONS: CanliiAction[] = [
  'listDatabases', 'listCases', 'getCaseMetadata',
  'getCitedCases', 'getCitingCases', 'getCitedLegislations',
  'listLegislationDatabases', 'listLegislation', 'getLegislationMetadata',
];

function buildCanLIIUrl(
  action: CanliiAction,
  params: Record<string, string>,
  apiKey: string
): string {
  const lang = params.language || 'en';

  switch (action) {
    case 'listDatabases':
      return `${CANLII_BASE}/caseBrowse/${lang}/?api_key=${apiKey}`;
    case 'listCases': {
      const qs = new URLSearchParams({ api_key: apiKey });
      if (params.offset) qs.set('offset', params.offset);
      if (params.resultCount) qs.set('resultCount', params.resultCount);
      if (params.publishedAfter) qs.set('publishedAfter', params.publishedAfter);
      if (params.publishedBefore) qs.set('publishedBefore', params.publishedBefore);
      if (params.decisionDateAfter) qs.set('decisionDateAfter', params.decisionDateAfter);
      if (params.decisionDateBefore) qs.set('decisionDateBefore', params.decisionDateBefore);
      return `${CANLII_BASE}/caseBrowse/${lang}/${params.databaseId}/?${qs.toString()}`;
    }
    case 'getCaseMetadata':
      return `${CANLII_BASE}/caseBrowse/${lang}/${params.databaseId}/${params.caseId}/?api_key=${apiKey}`;
    case 'getCitedCases':
      return `${CANLII_BASE}/caseCitator/en/${params.databaseId}/${params.caseId}/citedCases?api_key=${apiKey}`;
    case 'getCitingCases':
      return `${CANLII_BASE}/caseCitator/en/${params.databaseId}/${params.caseId}/citingCases?api_key=${apiKey}`;
    case 'getCitedLegislations':
      return `${CANLII_BASE}/caseCitator/en/${params.databaseId}/${params.caseId}/citedLegislations?api_key=${apiKey}`;
    case 'listLegislationDatabases':
      return `${CANLII_BASE}/legislationBrowse/${lang}/?api_key=${apiKey}`;
    case 'listLegislation':
      return `${CANLII_BASE}/legislationBrowse/${lang}/${params.databaseId}/?api_key=${apiKey}`;
    case 'getLegislationMetadata':
      return `${CANLII_BASE}/legislationBrowse/${lang}/${params.databaseId}/${params.legislationId}/?api_key=${apiKey}`;
    default:
      throw new Error(`Unknown CanLII action: ${action}`);
  }
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

    const apiKey = process.env.CANLII_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'CanLII API key not configured' });
    }

    const { action, params = {} } = req.body ?? {};
    if (!action || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${VALID_ACTIONS.join(', ')}` });
    }

    const url = buildCanLIIUrl(action as CanliiAction, params, apiKey);
    const canliiResponse = await fetch(url);

    if (!canliiResponse.ok) {
      const errorBody = await canliiResponse.text();
      return res.status(canliiResponse.status).json({
        error: `CanLII API error: ${errorBody}`,
      });
    }

    const data = await canliiResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('CanLII proxy error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export const config = { maxDuration: 15 };

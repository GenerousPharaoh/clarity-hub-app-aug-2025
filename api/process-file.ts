/**
 * Vercel Serverless Function: Document Processing
 * POST /api/process-file
 * Body: { fileId: string, projectId: string }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { processFile } from './lib/document-processor.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileId, projectId } = req.body;

    if (!fileId || !projectId) {
      return res.status(400).json({ error: 'fileId and projectId are required' });
    }
    if (!isUuid(fileId) || !isUuid(projectId)) {
      return res.status(400).json({ error: 'Invalid fileId or projectId format' });
    }

    // Validate auth header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.slice(7);
    const serviceClient = getServiceClient();
    if (!serviceClient) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify token and resolve user identity.
    const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }

    // Verify project access with explicit user ID to avoid auth-context mismatch.
    const { data: hasAccess, error: memberError } = await serviceClient.rpc(
      'user_has_project_access',
      { p_project_id: projectId, p_user_id: userData.user.id }
    );

    if (memberError) {
      console.error('Project access check failed:', memberError);
      return res.status(500).json({ error: 'Failed to verify project access' });
    }
    if (!hasAccess) {
      return res.status(403).json({ error: 'Not authorized to access this project' });
    }

    // Process the file (uses service role key internally)
    const result = await processFile(fileId, projectId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Process file error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export const config = {
  maxDuration: 120, // 2 minutes for large files
};

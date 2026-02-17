/**
 * Vercel Serverless Function: Document Processing
 * POST /api/process-file
 * Body: { fileId: string, projectId: string }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { processFile } from './lib/document-processor.js';

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

    // Validate the user's auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.slice(7);
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create a client with the user's token to verify permissions
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verify user can access this project
    const { data: hasAccess, error: memberError } = await userClient
      .rpc('user_has_project_access', { p_project_id: projectId });

    if (memberError || !hasAccess) {
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

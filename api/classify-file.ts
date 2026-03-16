/**
 * Vercel Serverless Function: Document Classification
 * POST /api/classify-file
 *
 * Runs AI classification on an already-processed file.
 * Useful for re-classifying files or classifying files processed before
 * classification was added to the pipeline.
 *
 * Body: { fileId: string, projectId: string }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { classifyDocument } from './lib/document-processor.js';

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
    const { fileId, projectId } = req.body ?? {};

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

    // Verify token and resolve user identity
    const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }

    // Verify project access
    const userId = userData.user.id;
    const [ownerResult, memberResult] = await Promise.all([
      serviceClient
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('owner_id', userId)
        .maybeSingle(),
      serviceClient
        .from('projects_users')
        .select('project_id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (ownerResult.error && memberResult.error) {
      console.error('Project access check failed:', ownerResult.error, memberResult.error);
      return res.status(500).json({ error: 'Failed to verify project access' });
    }
    if (!ownerResult.data && !memberResult.data) {
      return res.status(403).json({ error: 'Not authorized to access this project' });
    }

    // Fetch the file record with extracted text
    const { data: file, error: fileError } = await serviceClient
      .from('files')
      .select('id, name, project_id, extracted_text, processing_status')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.project_id !== projectId) {
      return res.status(400).json({ error: 'File does not belong to the specified project' });
    }

    if (!file.extracted_text || file.extracted_text.trim().length === 0) {
      return res.status(400).json({
        error: 'File has no extracted text. Process the file first before classifying.',
      });
    }

    // Run classification
    const classification = await classifyDocument(file.extracted_text, file.name);

    // Update the file record with classification results
    const { error: updateError } = await serviceClient
      .from('files')
      .update({
        document_type: classification.documentType,
        classification_confidence: classification.confidence,
        classification_metadata: classification.metadata,
        classification_source: 'ai',
        classified_at: new Date().toISOString(),
      })
      .eq('id', fileId);

    if (updateError) {
      console.error('Failed to update file with classification:', updateError.message);
      return res.status(500).json({ error: 'Classification succeeded but failed to save results' });
    }

    return res.status(200).json({
      fileId,
      classification: {
        documentType: classification.documentType,
        confidence: classification.confidence,
        metadata: classification.metadata,
      },
    });
  } catch (error) {
    console.error('Classify file error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export const config = {
  maxDuration: 30, // Classification should be fast
};

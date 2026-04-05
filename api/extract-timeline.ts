/**
 * Vercel Serverless Function: Bulk Timeline Extraction
 * POST /api/extract-timeline
 *
 * Extracts timeline events from all processed files in a project.
 * Replaces any existing AI-extracted events for the project before
 * inserting fresh results.
 *
 * Body: { projectId: string }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { extractTimelineEvents } from './_lib/timeline-extractor.js';

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

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
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
    const { projectId } = req.body ?? {};

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    if (!isUuid(projectId)) {
      return res.status(400).json({ error: 'Invalid projectId format' });
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

    // Verify OpenAI is available
    const openai = getOpenAI();
    if (!openai) {
      return res.status(503).json({ error: 'OpenAI not configured on the server' });
    }

    // Fetch all completed files with extracted text for this project
    const { data: files, error: filesError } = await serviceClient
      .from('files')
      .select('id, name, extracted_text')
      .eq('project_id', projectId)
      .eq('processing_status', 'completed')
      .not('extracted_text', 'is', null)
      .not('extracted_text', 'eq', '');

    if (filesError) {
      console.error('Failed to fetch project files:', filesError.message);
      return res.status(500).json({ error: 'Failed to fetch project files' });
    }

    if (!files || files.length === 0) {
      return res.status(200).json({
        projectId,
        filesProcessed: 0,
        eventsExtracted: 0,
        message: 'No processed files with text content found in this project.',
      });
    }

    // Delete existing AI-extracted timeline events for the entire project
    const { error: deleteError } = await serviceClient
      .from('timeline_events')
      .delete()
      .eq('project_id', projectId)
      .eq('extraction_method', 'ai');

    if (deleteError) {
      console.error('Failed to clear existing timeline events:', deleteError.message);
      return res.status(500).json({ error: 'Failed to clear existing timeline events' });
    }

    // Process each file sequentially, collect all events before inserting
    const allEventRows: Array<Record<string, unknown>> = [];
    let filesProcessed = 0;
    const errors: Array<{ fileId: string; fileName: string; error: string }> = [];

    for (const file of files) {
      try {
        const events = await extractTimelineEvents(
          file.extracted_text,
          file.name,
          file.id,
          openai
        );

        for (const event of events) {
          allEventRows.push({
            source_file_id: file.id,
            project_id: projectId,
            date: event.date,
            date_end: event.date_end || null,
            date_precision: event.date_precision,
            date_text: event.date_text || null,
            title: event.title,
            description: event.description || null,
            category: event.category,
            event_type: event.event_type,
            significance: event.significance,
            parties: event.parties || [],
            source_quote: event.source_quote || null,
            page_reference: event.page_reference || null,
            extraction_method: 'ai',
            confidence: event.confidence ?? 0.7,
          });
        }

        filesProcessed++;
      } catch (fileError) {
        errors.push({
          fileId: file.id,
          fileName: file.name,
          error: fileError instanceof Error ? fileError.message : 'Unknown error',
        });
      }
    }

    // Deduplicate: events with same date + similar title (case-insensitive, trimmed) are duplicates
    const seen = new Map<string, Record<string, unknown>>();
    for (const row of allEventRows) {
      const dateStr = String(row.date).slice(0, 10);
      const titleNorm = String(row.title).toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
      const key = `${dateStr}||${titleNorm}`;

      if (!seen.has(key)) {
        seen.set(key, row);
      } else {
        // Keep the one with higher significance or longer description
        const existing = seen.get(key)!;
        const sigOrder = { high: 3, medium: 2, low: 1 };
        const existingSig = sigOrder[existing.significance as keyof typeof sigOrder] ?? 1;
        const newSig = sigOrder[row.significance as keyof typeof sigOrder] ?? 1;
        if (newSig > existingSig || (newSig === existingSig && String(row.description ?? '').length > String(existing.description ?? '').length)) {
          seen.set(key, row);
        }
      }
    }

    const deduped = Array.from(seen.values());
    const duplicatesRemoved = allEventRows.length - deduped.length;
    let totalEventsExtracted = 0;

    if (deduped.length > 0) {
      const { error: insertError } = await serviceClient
        .from('timeline_events')
        .insert(deduped);

      if (insertError) {
        errors.push({ fileId: 'batch', fileName: 'batch insert', error: insertError.message });
      } else {
        totalEventsExtracted = deduped.length;
      }
    }

    return res.status(200).json({
      projectId,
      filesProcessed,
      totalFiles: files.length,
      totalEventsExtracted,
      duplicatesRemoved,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (error) {
    console.error('Extract timeline error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export const config = {
  maxDuration: 300, // 5 minutes for bulk extraction across many files
};

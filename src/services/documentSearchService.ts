/**
 * Client-side document search using the hybrid vector + full-text
 * search_documents RPC in Supabase.
 */

import { supabase } from '@/lib/supabase';
import { aiRouter } from './aiRouter';

export interface SearchResult {
  chunkId: string;
  fileId: string;
  content: string;
  pageNumber: number | null;
  sectionHeading: string | null;
  sourceFileName: string;
  sourceFileType: string;
  score: number;
  timestampStart: number | null;
}

/**
 * Search across all processed documents in a project.
 * Uses Reciprocal Rank Fusion over vector + full-text results.
 */
export async function searchDocuments(params: {
  query: string;
  projectId: string;
  fileType?: string;
  limit?: number;
}): Promise<SearchResult[]> {
  const { query, projectId, fileType, limit = 8 } = params;

  if (!query.trim()) return [];

  try {
    // Generate query embedding client-side
    const embedding = await aiRouter.generateEmbedding(query);

    if (!embedding || embedding.length === 0) {
      // Fall back to text-only search if embedding fails
      return textOnlySearch(query, projectId, fileType, limit);
    }

    // Call the hybrid search RPC
    const { data, error } = await supabase.rpc('search_documents', {
      p_query_text: query,
      p_query_embedding: JSON.stringify(embedding),
      p_match_count: limit,
      p_project_id: projectId,
      p_file_type: fileType ?? undefined,
    });

    if (error) {
      console.error('search_documents RPC error:', error);
      return [];
    }

    return (data || []).map((row: {
      chunk_id: string;
      file_id: string;
      content: string;
      page_number: number | null;
      section_heading: string | null;
      source_file_name: string;
      source_file_type: string;
      rrf_score: number;
      timestamp_start: number | null;
    }) => ({
      chunkId: row.chunk_id,
      fileId: row.file_id,
      content: row.content,
      pageNumber: row.page_number,
      sectionHeading: row.section_heading,
      sourceFileName: row.source_file_name,
      sourceFileType: row.source_file_type,
      score: row.rrf_score,
      timestampStart: row.timestamp_start,
    }));
  } catch (err) {
    console.error('Document search failed:', err);
    return [];
  }
}

/**
 * Fallback text-only search when embeddings aren't available.
 */
async function textOnlySearch(
  query: string,
  projectId: string,
  fileType: string | undefined,
  limit: number
): Promise<SearchResult[]> {
  try {
    // Restrict fallback search to files in the active project.
    const { data: projectFiles, error: filesError } = await supabase
      .from('files')
      .select('id')
      .eq('project_id', projectId)
      .is('is_deleted', false);

    if (filesError) return [];

    const fileIds = (projectFiles ?? []).map((f) => f.id);
    if (fileIds.length === 0) return [];

    const baseQuery = supabase
      .from('document_chunks')
      .select(`
        id,
        file_id,
        content,
        page_number,
        section_heading,
        source_file_name,
        source_file_type,
        timestamp_start
      `)
      .textSearch('fts', query, { type: 'websearch' })
      .in('file_id', fileIds)
      .limit(limit);

    const queryBuilder = fileType
      ? baseQuery.eq('source_file_type', fileType)
      : baseQuery;

    const { data, error } = await queryBuilder;

    if (error || !data) return [];

    return data.map((row) => ({
      chunkId: row.id,
      fileId: row.file_id,
      content: row.content,
      pageNumber: row.page_number,
      sectionHeading: row.section_heading,
      sourceFileName: row.source_file_name || '',
      sourceFileType: row.source_file_type || '',
      score: 1,
      timestampStart: row.timestamp_start,
    }));
  } catch {
    return [];
  }
}

/**
 * Format search results as context for AI prompts.
 */
export function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return '';

  const lines = results.map((r, i) => {
    const parts = [`[Source ${i + 1}: ${r.sourceFileName}`];
    if (r.pageNumber) parts.push(`page ${r.pageNumber}`);
    if (r.sectionHeading) parts.push(`section "${r.sectionHeading}"`);
    parts.push(']');

    return `${parts.join(', ')}\n${r.content.slice(0, 800)}`;
  });

  return `\n--- DOCUMENT SEARCH RESULTS ---\n${lines.join('\n\n')}\n--- END SEARCH RESULTS ---`;
}

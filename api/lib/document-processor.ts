/**
 * Core document processing pipeline.
 * Extracts text from various file types, generates summaries,
 * chunks content hierarchically, and creates embeddings.
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { chunkText, chunkTranscript, type Chunk } from './chunker.js';
import { embedBatch } from './embeddings.js';

// Initialize clients
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
  return new OpenAI({ apiKey });
}

export interface ProcessingResult {
  status: 'completed' | 'failed';
  chunksCreated: number;
  summary: string | null;
  error?: string;
}

/**
 * Main processing pipeline for a file.
 */
export async function processFile(
  fileId: string,
  projectId: string
): Promise<ProcessingResult> {
  const supabase = getSupabase();

  try {
    // Mark as processing
    await supabase
      .from('files')
      .update({ processing_status: 'processing', processing_error: null })
      .eq('id', fileId);

    // 1. Fetch file metadata
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      throw new Error(`File not found: ${fileError?.message || 'unknown'}`);
    }

    // 2. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('files')
      .download(file.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || 'unknown'}`);
    }

    // 3. Extract text based on file type
    const fileType = file.file_type || detectFileType(file.name);
    const extractedText = await extractText(fileData, fileType, file.name);

    if (!extractedText || extractedText.trim().length === 0) {
      await supabase
        .from('files')
        .update({
          processing_status: 'completed',
          processed_at: new Date().toISOString(),
          extracted_text: '',
          ai_summary: 'No extractable text content found.',
          chunk_count: 0,
        })
        .eq('id', fileId);

      return { status: 'completed', chunksCreated: 0, summary: 'No extractable text content found.' };
    }

    // 4. Generate AI summary
    const summary = await generateSummary(extractedText, file.name);

    // 5. Chunk text hierarchically
    const chunks = chunkText(extractedText);

    // 6. Generate embeddings in batches
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await embedBatch(chunkTexts);

    // 7. Delete any existing chunks for this file
    await supabase
      .from('document_chunks')
      .delete()
      .eq('file_id', fileId);

    // 8. Insert parent chunks first (to get IDs for children)
    const parentChunks = chunks.filter((c) => c.chunkType === 'parent');
    const childChunks = chunks.filter((c) => c.chunkType === 'child');

    const parentRows = parentChunks.map((chunk, i) => {
      const globalIndex = chunks.indexOf(chunk);
      return {
        file_id: fileId,
        content: chunk.content,
        chunk_type: chunk.chunkType,
        chunk_index: chunk.chunkIndex,
        page_number: chunk.pageNumber || null,
        section_heading: chunk.sectionHeading || null,
        char_start: chunk.charStart,
        char_end: chunk.charEnd,
        timestamp_start: chunk.timestampStart || null,
        timestamp_end: chunk.timestampEnd || null,
        source_file_name: file.name,
        source_file_type: fileType,
        embedding: JSON.stringify(embeddings[globalIndex] || []),
        metadata: {},
      };
    });

    const { data: insertedParents, error: parentError } = await supabase
      .from('document_chunks')
      .insert(parentRows)
      .select('id, chunk_index');

    if (parentError) {
      throw new Error(`Failed to insert parent chunks: ${parentError.message}`);
    }

    // Build parent ID lookup
    const parentIdMap = new Map<number, string>();
    for (const p of insertedParents || []) {
      parentIdMap.set(p.chunk_index, p.id);
    }

    // Insert child chunks with parent references
    if (childChunks.length > 0) {
      const childRows = childChunks.map((chunk) => {
        const globalIndex = chunks.indexOf(chunk);
        return {
          file_id: fileId,
          content: chunk.content,
          chunk_type: chunk.chunkType,
          chunk_index: chunk.chunkIndex,
          parent_chunk_id: chunk.parentIndex != null ? parentIdMap.get(chunk.parentIndex) || null : null,
          page_number: chunk.pageNumber || null,
          section_heading: chunk.sectionHeading || null,
          char_start: chunk.charStart,
          char_end: chunk.charEnd,
          source_file_name: file.name,
          source_file_type: fileType,
          embedding: JSON.stringify(embeddings[globalIndex] || []),
          metadata: {},
        };
      });

      const { error: childError } = await supabase
        .from('document_chunks')
        .insert(childRows);

      if (childError) {
        console.error('Failed to insert child chunks:', childError.message);
      }
    }

    // 9. Update file with processing results
    await supabase
      .from('files')
      .update({
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
        ai_summary: summary,
        extracted_text: extractedText.slice(0, 50000), // Cap stored text
        chunk_count: chunks.length,
      })
      .eq('id', fileId);

    return {
      status: 'completed',
      chunksCreated: chunks.length,
      summary,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown processing error';

    await supabase
      .from('files')
      .update({
        processing_status: 'failed',
        processing_error: errorMsg,
      })
      .eq('id', fileId);

    return {
      status: 'failed',
      chunksCreated: 0,
      summary: null,
      error: errorMsg,
    };
  }
}

/**
 * Extract text content from a file blob based on type.
 */
async function extractText(
  blob: Blob,
  fileType: string,
  fileName: string
): Promise<string> {
  switch (fileType) {
    case 'pdf':
      return extractPdfText(blob);
    case 'image':
      return extractImageText(blob, fileName);
    case 'audio':
    case 'video':
      return transcribeAudio(blob, fileName);
    case 'text':
    case 'document':
      return blob.text();
    default:
      // Try text extraction as fallback
      try {
        return await blob.text();
      } catch {
        return '';
      }
  }
}

/**
 * Extract text from PDF using pdf-parse.
 */
async function extractPdfText(blob: Blob): Promise<string> {
  try {
    // Dynamic import for pdf-parse (Node.js only)
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = Buffer.from(await blob.arrayBuffer());
    const result = await pdfParse(buffer);
    return result.text || '';
  } catch (error) {
    console.error('PDF extraction failed:', error);
    // Fallback: use GPT-4.1 vision for OCR
    return extractImageText(blob, 'document.pdf');
  }
}

/**
 * Extract text from images using GPT-4.1 vision OCR.
 */
async function extractImageText(blob: Blob, fileName: string): Promise<string> {
  const openai = getOpenAI();
  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = blob.type || 'image/png';

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract all text content from this ${fileName.endsWith('.pdf') ? 'document' : 'image'}. Return only the extracted text, preserving the original structure and formatting as much as possible. If there are tables, format them clearly. If there is no text, respond with an empty string.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Transcribe audio/video using OpenAI Whisper.
 */
async function transcribeAudio(blob: Blob, fileName: string): Promise<string> {
  const openai = getOpenAI();

  // Convert blob to File-like object for the API
  const file = new File([blob], fileName, { type: blob.type });

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    response_format: 'text',
  });

  return typeof response === 'string' ? response : '';
}

/**
 * Generate an AI summary of extracted text.
 */
async function generateSummary(text: string, fileName: string): Promise<string> {
  const openai = getOpenAI();

  // Truncate for summary generation
  const truncated = text.slice(0, 12000);

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a legal document analyst. Provide a concise 2-3 sentence summary of the document content. Focus on key facts, dates, parties, and legal significance.',
      },
      {
        role: 'user',
        content: `Summarize this document (filename: "${fileName}"):\n\n${truncated}`,
      },
    ],
    max_tokens: 300,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || 'Summary unavailable.';
}

/**
 * Detect file type from filename extension.
 */
function detectFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const typeMap: Record<string, string> = {
    pdf: 'pdf',
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image', tiff: 'image',
    mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio',
    mp4: 'video', mov: 'video', webm: 'video', avi: 'video', mkv: 'video',
    doc: 'document', docx: 'document', rtf: 'document',
    txt: 'text', md: 'text', csv: 'text', json: 'text', xml: 'text', html: 'text',
  };
  return typeMap[ext] || 'other';
}

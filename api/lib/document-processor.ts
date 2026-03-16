/**
 * Core document processing pipeline.
 * Extracts text from various file types, generates summaries,
 * chunks content hierarchically, and creates embeddings.
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { chunkText } from './chunker.js';
import { embedBatch } from './embeddings.js';
import { extractTimelineEvents } from './timeline-extractor.js';

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

export interface ClassificationResult {
  documentType: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

/**
 * Classify a legal document using GPT-4.1-mini.
 * Identifies document type, extracts key metadata (dates, parties, amounts),
 * and assigns a confidence score.
 */
export async function classifyDocument(
  extractedText: string,
  fileName: string
): Promise<ClassificationResult> {
  const openai = getOpenAI();

  // Filename hints for common patterns
  const lower = fileName.toLowerCase();
  let hint = '';
  if (lower.includes('statement of claim')) hint = 'This filename suggests a Statement of Claim.';
  else if (lower.includes('statement of defence')) hint = 'This filename suggests a Statement of Defence.';
  else if (lower.includes('affidavit')) hint = 'This filename suggests an Affidavit.';
  else if (lower.includes('termination')) hint = 'This filename suggests a Termination Letter.';
  else if (lower.includes('offer to settle')) hint = 'This filename suggests an Offer to Settle.';
  else if (lower.includes('demand letter')) hint = 'This filename suggests a Demand Letter.';
  else if (lower.includes('employment contract') || lower.includes('employment agreement')) hint = 'This filename suggests an Employment Contract.';
  else if (lower.includes('notice of motion')) hint = 'This filename suggests a Notice of Motion.';
  else if (lower.includes('factum')) hint = 'This filename suggests a Factum.';
  else if (lower.includes('endorsement')) hint = 'This filename suggests a Court Endorsement.';
  else if (lower.includes('hrto') || lower.includes('human rights')) hint = 'This filename suggests an HRTO application or response.';
  else if (lower.includes('medical') || lower.includes('clinical')) hint = 'This filename suggests a Medical Record or Report.';
  else if (lower.includes('pay stub') || lower.includes('paystub')) hint = 'This filename suggests a Pay Stub.';

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'user',
        content: `You are a legal document classifier for Ontario litigation. ${hint}

Classify this document and extract metadata. Return JSON only.

FILENAME: "${fileName}"
TEXT (first 6000 chars):
${extractedText.slice(0, 6000)}

Return: { "document_type": "<type_key>", "confidence": <0-1>, "document_date": "<YYYY-MM-DD or null>", "parties_mentioned": ["..."], "key_dates": [{"date":"...","description":"..."}], "monetary_amounts": [{"amount":<n>,"currency":"CAD","description":"..."}], "court_file_number": "<or null>", "summary_tags": ["..."] }

document_type must be one of: statement_of_claim, statement_of_defence, reply, counterclaim, notice_of_motion, factum, book_of_authorities, court_order, endorsement, reasons_for_decision, judgment, affidavit, statutory_declaration, examination_transcript, expert_report, witness_statement, offer_to_settle, demand_letter, settlement_agreement, mediation_brief, employment_contract, termination_letter, resignation_letter, performance_review, offer_letter, severance_package, financial_statement, tax_return, pay_stub, t4_slip, roe, bank_statement, hrto_application, hrto_response, professional_complaint, investigation_report, legal_correspondence, email, text_message, internal_memo, medical_record, medical_report, disability_claim, ime_report, legislation, case_law, photograph, other`,
      },
    ],
    max_tokens: 800,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  try {
    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      documentType: result.document_type || 'other',
      confidence: Math.min(Math.max(result.confidence || 0, 0), 1),
      metadata: result,
    };
  } catch {
    return { documentType: 'other', confidence: 0, metadata: {} };
  }
}

/**
 * Main processing pipeline for a file.
 */
export async function processFile(
  fileId: string,
  projectId: string
): Promise<ProcessingResult> {
  const supabase = getSupabase();
  let shouldCleanupChunks = false;

  try {
    // Mark as processing
    const { error: markProcessingError } = await supabase
      .from('files')
      .update({ processing_status: 'processing', processing_error: null })
      .eq('id', fileId);

    if (markProcessingError) {
      throw new Error(`Failed to mark file as processing: ${markProcessingError.message}`);
    }

    // 1. Fetch file metadata
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      throw new Error(`File not found: ${fileError?.message || 'unknown'}`);
    }

    // Guard against cross-project processing requests.
    if (file.project_id !== projectId) {
      throw new Error('File does not belong to the specified project');
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
      const { error: emptyResultError } = await supabase
        .from('files')
        .update({
          processing_status: 'completed',
          processed_at: new Date().toISOString(),
          extracted_text: '',
          ai_summary: 'No extractable text content found.',
          chunk_count: 0,
          processing_error: null,
        })
        .eq('id', fileId);

      if (emptyResultError) {
        throw new Error(`Failed to save processing result: ${emptyResultError.message}`);
      }

      return { status: 'completed', chunksCreated: 0, summary: 'No extractable text content found.' };
    }

    // 4. Classify document (before summary for better context)
    let classification: ClassificationResult = { documentType: 'other', confidence: 0, metadata: {} };
    try {
      classification = await classifyDocument(extractedText, file.name);
    } catch (classifyError) {
      console.error('Document classification failed (non-fatal):', classifyError);
    }

    // 5. Generate AI summary (with classification context)
    const summary = await generateSummary(
      extractedText,
      file.name,
      classification.documentType !== 'other' ? classification.documentType : undefined
    );

    // 6. Extract timeline events (non-blocking — failures do not fail the pipeline)
    let timelineEventsInserted = 0;
    try {
      const openai = getOpenAI();
      const timelineEvents = await extractTimelineEvents(extractedText, file.name, fileId, openai);

      if (timelineEvents.length > 0) {
        // Delete existing AI-extracted events for this file (idempotent)
        await supabase
          .from('timeline_events')
          .delete()
          .eq('source_file_id', fileId)
          .eq('extraction_source', 'ai');

        // Insert new events
        const eventRows = timelineEvents.map((event) => ({
          file_id: fileId,
          source_file_id: fileId,
          project_id: projectId,
          event_date: event.date,
          event_date_end: event.date_end || null,
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
          extraction_source: 'ai',
          extracted_at: new Date().toISOString(),
        }));

        const { error: timelineError } = await supabase
          .from('timeline_events')
          .insert(eventRows);

        if (timelineError) {
          console.error('Timeline event insertion failed (non-fatal):', timelineError.message);
        } else {
          timelineEventsInserted = eventRows.length;
        }
      }
    } catch (timelineError) {
      console.error('Timeline extraction failed (non-fatal):', timelineError);
    }

    // 7. Chunk text hierarchically
    const chunks = chunkText(extractedText);

    // 8. Generate embeddings in batches
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await embedBatch(chunkTexts);

    // 9. Delete any existing chunks for this file
    const { error: deleteChunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('file_id', fileId);

    if (deleteChunksError) {
      throw new Error(`Failed to clear existing chunks: ${deleteChunksError.message}`);
    }
    shouldCleanupChunks = true;

    // 10. Insert parent chunks first (to get IDs for children)
    const parentChunks = chunks.filter((c) => c.chunkType === 'parent');
    const childChunks = chunks.filter((c) => c.chunkType === 'child');

    const parentRows = parentChunks.map((chunk) => {
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
        throw new Error(`Failed to insert child chunks: ${childError.message}`);
      }
    }

    // 11. Update file with processing results (including classification)
    const { error: updateFileError } = await supabase
      .from('files')
      .update({
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
        ai_summary: summary,
        extracted_text: extractedText.slice(0, 50000), // Cap stored text
        chunk_count: chunks.length,
        processing_error: null,
        // Classification fields
        document_type: classification.documentType,
        classification_confidence: classification.confidence,
        classification_metadata: classification.metadata,
        classification_source: 'ai',
        classified_at: new Date().toISOString(),
        // Timeline count
        timeline_events_count: timelineEventsInserted,
      })
      .eq('id', fileId);

    if (updateFileError) {
      throw new Error(`Failed to save processing output: ${updateFileError.message}`);
    }

    shouldCleanupChunks = false;

    return {
      status: 'completed',
      chunksCreated: chunks.length,
      summary,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown processing error';

    if (shouldCleanupChunks) {
      const { error: cleanupError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('file_id', fileId);

      if (cleanupError) {
        console.error('Failed to clean up partial chunks:', cleanupError.message);
      }
    }

    await supabase
      .from('files')
      .update({
        processing_status: 'failed',
        processing_error: errorMsg,
        processed_at: null,
        chunk_count: 0,
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
    // pdf-parse v2 exposes a parser class instead of a callable default export.
    const { PDFParse } = await import('pdf-parse');
    const data = new Uint8Array(await blob.arrayBuffer());
    const parser = new PDFParse({ data });

    try {
      const result = await parser.getText();
      return result.text || '';
    } finally {
      await parser.destroy();
    }
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
 * Optionally uses document type classification for better context.
 */
async function generateSummary(
  text: string,
  fileName: string,
  documentType?: string
): Promise<string> {
  const openai = getOpenAI();

  // Truncate for summary generation
  const truncated = text.slice(0, 12000);

  const typeContext = documentType
    ? ` This document has been classified as a "${documentType.replace(/_/g, ' ')}".`
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: `You are a legal document analyst.${typeContext} Provide a concise 2-3 sentence summary of the document content. Focus on key facts, dates, parties, and legal significance.`,
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

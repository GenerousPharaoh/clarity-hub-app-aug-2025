// LEGACY PROTOTYPE: retained for reference only.
// Canonical processing flow is documented in docs/processing-architecture.md.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { generateText, generateEmbeddings, analyzeImage } from '../utils/googleai.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ProcessingJob {
  id: string
  file_id: string
  project_id: string
  processing_type: string
  file_storage_path: string
  file_content_type: string
  file_size: number
}

interface ProcessingResult {
  extractedText?: string
  documentType?: string
  aiSummary?: string
  aiInsights?: Record<string, any>
  partiesMentioned?: string[]
  keyDates?: Array<{ date: string, description: string, confidence: number }>
  legalTerms?: string[]
  deadlines?: Array<{ date: string, description: string, type: string }>
  citations?: string[]
  confidenceScores?: Record<string, number>
  contentEmbedding?: number[]
  summaryEmbedding?: number[]
}

/**
 * Extract text from different file types using Vertex AI Vision
 */
async function extractText(fileData: Uint8Array, contentType: string, storagePath: string): Promise<string> {
  try {
    console.log(`[ProcessDocument] Starting text extraction for ${contentType}`)
    
    if (contentType.startsWith('image/') || contentType === 'application/pdf') {
      // Use Vertex AI Vision for OCR
      const base64Data = btoa(String.fromCharCode(...fileData))
      
      const ocrPrompt = `
Please extract all text from this document. Maintain the original formatting as much as possible.
Focus on:
- All visible text content
- Headers and titles
- Bullet points and numbered lists
- Tables and structured data
- Signatures and handwritten text (if legible)

Return only the extracted text without any commentary.`

      const extractedText = await analyzeImage(base64Data, ocrPrompt)
      console.log(`[ProcessDocument] Successfully extracted ${extractedText.length} characters from image/PDF`)
      return extractedText
    }
    
    if (contentType.startsWith('text/') || 
        contentType === 'application/json' || 
        contentType.includes('xml')) {
      // Direct text extraction for text files
      const textContent = new TextDecoder().decode(fileData)
      console.log(`[ProcessDocument] Successfully extracted ${textContent.length} characters from text file`)
      return textContent
    }
    
    if (contentType.startsWith('audio/') || contentType.startsWith('video/')) {
      // For now, return placeholder - would need Speech-to-Text API integration
      console.log(`[ProcessDocument] Audio/Video transcription not yet implemented for ${contentType}`)
      return `[Audio/Video file - Transcription pending. File type: ${contentType}]`
    }
    
    console.log(`[ProcessDocument] Unsupported file type: ${contentType}`)
    return `[Unsupported file type: ${contentType}]`
    
  } catch (error) {
    console.error(`[ProcessDocument] Error extracting text:`, error)
    throw new Error(`Text extraction failed: ${error.message}`)
  }
}

/**
 * Analyze document content using Gemini 2.5 Pro
 */
async function analyzeContent(extractedText: string, fileName: string): Promise<Partial<ProcessingResult>> {
  try {
    console.log(`[ProcessDocument] Starting AI analysis for document: ${fileName}`)
    
    const analysisPrompt = `
You are a legal document analysis AI. Analyze the following document and extract key information.

Document Name: ${fileName}
Document Content:
${extractedText.substring(0, 50000)} // Limit for token constraints

Please provide a comprehensive analysis in the following JSON format:
{
  "documentType": "contract|motion|correspondence|pleading|discovery|evidence|legal_brief|court_order|deposition|transcript|exhibit|other",
  "aiSummary": "A concise 2-3 sentence summary of the document",
  "aiInsights": {
    "mainPurpose": "Primary purpose of the document",
    "keyPoints": ["List of 3-5 key points"],
    "legalImplications": "Important legal implications",
    "actionItems": ["Any action items or next steps mentioned"]
  },
  "partiesMentioned": ["List of all parties, people, or entities mentioned"],
  "keyDates": [
    {
      "date": "YYYY-MM-DD",
      "description": "Description of what this date represents",
      "confidence": 0.9
    }
  ],
  "legalTerms": ["Important legal terms and concepts found"],
  "deadlines": [
    {
      "date": "YYYY-MM-DD",
      "description": "Deadline description",
      "type": "filing|response|hearing|discovery|other"
    }
  ],
  "citations": ["Legal citations found (case law, statutes, regulations)"],
  "confidenceScores": {
    "documentType": 0.95,
    "partiesExtraction": 0.85,
    "datesExtraction": 0.90,
    "overallAnalysis": 0.88
  }
}

Focus on accuracy and provide confidence scores. If information is uncertain, use lower confidence scores.
Return only the JSON object without any additional text or formatting.`

    const analysisResult = await generateText(analysisPrompt)
    
    try {
      // Parse the JSON response
      const analysis = JSON.parse(analysisResult)
      console.log(`[ProcessDocument] Successfully analyzed document, found ${analysis.partiesMentioned?.length || 0} parties`)
      return analysis
    } catch (parseError) {
      console.error(`[ProcessDocument] Failed to parse AI analysis JSON:`, parseError)
      // Return fallback analysis
      return {
        documentType: 'other',
        aiSummary: `Document analysis completed for ${fileName}`,
        aiInsights: { mainPurpose: 'Analysis parsing failed', keyPoints: [] },
        partiesMentioned: [],
        keyDates: [],
        legalTerms: [],
        deadlines: [],
        citations: [],
        confidenceScores: { overallAnalysis: 0.3 }
      }
    }
    
  } catch (error) {
    console.error(`[ProcessDocument] Error in AI analysis:`, error)
    throw new Error(`AI analysis failed: ${error.message}`)
  }
}

/**
 * Generate embeddings for semantic search
 */
async function generateDocumentEmbeddings(extractedText: string, summary: string): Promise<{ contentEmbedding: number[], summaryEmbedding: number[] }> {
  try {
    console.log(`[ProcessDocument] Generating embeddings for content and summary`)
    
    // Generate embeddings for the main content (truncated if too long)
    const contentForEmbedding = extractedText.substring(0, 8000) // Limit for embedding model
    const contentEmbedding = await generateEmbeddings(contentForEmbedding)
    
    // Generate embeddings for the summary
    const summaryEmbedding = await generateEmbeddings(summary)
    
    console.log(`[ProcessDocument] Successfully generated embeddings: content(${contentEmbedding.length}), summary(${summaryEmbedding.length})`)
    
    return {
      contentEmbedding,
      summaryEmbedding
    }
    
  } catch (error) {
    console.error(`[ProcessDocument] Error generating embeddings:`, error)
    throw new Error(`Embedding generation failed: ${error.message}`)
  }
}

/**
 * Process a single document through the full AI pipeline
 */
async function processDocument(job: ProcessingJob): Promise<void> {
  const { file_id, project_id, file_storage_path, file_content_type } = job
  
  try {
    // Log processing start
    await supabase.rpc('log_ai_processing', {
      p_file_id: file_id,
      p_processing_type: 'full_processing',
      p_log_level: 'info',
      p_message: 'Started document processing',
      p_metadata: { job_id: job.id, content_type: file_content_type }
    })
    
    // Update processing status
    await supabase
      .from('processed_content')
      .upsert({
        file_id,
        project_id,
        processing_status: 'processing',
        processing_started_at: new Date().toISOString(),
        owner_id: (await supabase.auth.admin.getUserById(job.id)).data.user?.id // Use service role
      }, { onConflict: 'file_id' })
    
    // Download file from storage
    console.log(`[ProcessDocument] Downloading file: ${file_storage_path}`)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('files')
      .download(file_storage_path)
    
    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }
    
    const fileBuffer = new Uint8Array(await fileData.arrayBuffer())
    
    // Step 1: Extract text content
    const extractedText = await extractText(fileBuffer, file_content_type, file_storage_path)
    
    // Step 2: Analyze content with AI
    const fileName = file_storage_path.split('/').pop() || 'unknown'
    const analysisResult = await analyzeContent(extractedText, fileName)
    
    // Step 3: Generate embeddings for search
    const { contentEmbedding, summaryEmbedding } = await generateDocumentEmbeddings(
      extractedText, 
      analysisResult.aiSummary || ''
    )
    
    // Step 4: Save results to database
    const { error: saveError } = await supabase
      .from('processed_content')
      .upsert({
        file_id,
        project_id,
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString(),
        extracted_text: extractedText,
        document_type: analysisResult.documentType,
        ai_summary: analysisResult.aiSummary,
        ai_insights: analysisResult.aiInsights || {},
        parties_mentioned: analysisResult.partiesMentioned || [],
        key_dates: analysisResult.keyDates || [],
        legal_terms: analysisResult.legalTerms || [],
        deadlines: analysisResult.deadlines || [],
        citations: analysisResult.citations || [],
        confidence_scores: analysisResult.confidenceScores || {},
        content_embedding: `[${contentEmbedding.join(',')}]`,
        summary_embedding: `[${summaryEmbedding.join(',')}]`,
        owner_id: (await supabase.auth.admin.getUserById(job.id)).data.user?.id
      }, { onConflict: 'file_id' })
    
    if (saveError) {
      throw new Error(`Failed to save analysis results: ${saveError.message}`)
    }
    
    // Update file record with processing status
    await supabase
      .from('files')
      .update({
        processing_status: 'completed',
        ai_summary: analysisResult.aiSummary,
        document_type: analysisResult.documentType
      })
      .eq('id', file_id)
    
    // Mark processing job as completed
    await supabase
      .from('file_processing_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)
    
    // Log successful completion
    await supabase.rpc('log_ai_processing', {
      p_file_id: file_id,
      p_processing_type: 'full_processing',
      p_log_level: 'info',
      p_message: 'Document processing completed successfully',
      p_metadata: { 
        job_id: job.id, 
        document_type: analysisResult.documentType,
        text_length: extractedText.length,
        parties_count: analysisResult.partiesMentioned?.length || 0
      }
    })
    
    console.log(`[ProcessDocument] Successfully processed document ${file_id}`)
    
  } catch (error) {
    console.error(`[ProcessDocument] Error processing document ${file_id}:`, error)
    
    // Update processing status to failed
    await supabase
      .from('processed_content')
      .upsert({
        file_id,
        project_id,
        processing_status: 'failed',
        processing_error: error.message,
        owner_id: (await supabase.auth.admin.getUserById(job.id)).data.user?.id
      }, { onConflict: 'file_id' })
    
    // Update file status
    await supabase
      .from('files')
      .update({ processing_status: 'failed' })
      .eq('id', file_id)
    
    // Mark job as failed
    await supabase
      .from('file_processing_queue')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)
    
    // Log error
    await supabase.rpc('log_ai_processing', {
      p_file_id: file_id,
      p_processing_type: 'full_processing',
      p_log_level: 'error',
      p_message: `Document processing failed: ${error.message}`,
      p_metadata: { job_id: job.id }
    })
    
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, file_id, project_id } = await req.json()
    
    if (action === 'process_file') {
      // Queue a specific file for processing
      if (!file_id || !project_id) {
        throw new Error('file_id and project_id are required')
      }
      
      const { data: queueId, error: queueError } = await supabase
        .rpc('queue_file_for_processing', {
          p_file_id: file_id,
          p_project_id: project_id,
          p_processing_type: 'full',
          p_priority: 7
        })
      
      if (queueError) {
        throw new Error(`Failed to queue file: ${queueError.message}`)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'File queued for processing',
          queue_id: queueId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (action === 'process_next') {
      // Process the next file in the queue
      const { data: jobs, error: jobError } = await supabase
        .rpc('get_next_processing_job')
      
      if (jobError) {
        throw new Error(`Failed to get processing job: ${jobError.message}`)
      }
      
      if (!jobs || jobs.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No files in processing queue' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const job = jobs[0] as ProcessingJob
      console.log(`[ProcessDocument] Processing job ${job.id} for file ${job.file_id}`)
      
      // Process the document
      await processDocument(job)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document processed successfully',
          file_id: job.file_id,
          job_id: job.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (action === 'get_status') {
      // Get processing status for a file
      if (!file_id) {
        throw new Error('file_id is required')
      }
      
      const { data: status, error: statusError } = await supabase
        .from('processed_content')
        .select('processing_status, processing_started_at, processing_completed_at, processing_error, ai_summary, document_type')
        .eq('file_id', file_id)
        .single()
      
      if (statusError && statusError.code !== 'PGRST116') { // Not found is OK
        throw new Error(`Failed to get status: ${statusError.message}`)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: status || { processing_status: 'pending' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    throw new Error(`Unknown action: ${action}`)
    
  } catch (error) {
    console.error('[ProcessDocument] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

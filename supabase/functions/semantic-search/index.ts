// LEGACY PROTOTYPE: retained for reference only.
// Canonical processing flow is documented in docs/processing-architecture.md.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { generateEmbeddings, generateText } from '../utils/googleai.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SearchResult {
  file_id: string
  file_name: string
  document_type: string
  ai_summary: string
  similarity_score: number
  extracted_text: string
  highlighted_text?: string
  metadata?: any
}

interface SearchFilters {
  documentTypes?: string[]
  dateRange?: {
    start: string
    end: string
  }
  parties?: string[]
  legalTerms?: string[]
  confidenceThreshold?: number
}

/**
 * Expand search query using AI to include related legal terms
 */
async function expandLegalQuery(query: string): Promise<{ expandedQuery: string, suggestedTerms: string[] }> {
  try {
    console.log(`[SemanticSearch] Expanding query: "${query}"`)
    
    const expansionPrompt = `
You are a legal search expert. Given a search query, suggest related legal terms and concepts that should be included in the search.

Original Query: "${query}"

Provide suggestions in the following JSON format:
{
  "expandedQuery": "Enhanced version of the original query with legal context",
  "suggestedTerms": ["term1", "term2", "term3"],
  "legalConcepts": ["concept1", "concept2"],
  "synonyms": ["synonym1", "synonym2"]
}

Focus on:
- Legal terminology and synonyms
- Related concepts in law
- Common phrases used in legal documents
- Both formal legal language and plain language equivalents

Return only the JSON object without any additional text.`

    const expansionResult = await generateText(expansionPrompt)
    
    try {
      const expansion = JSON.parse(expansionResult)
      console.log(`[SemanticSearch] Query expanded with ${expansion.suggestedTerms?.length || 0} suggested terms`)
      return {
        expandedQuery: expansion.expandedQuery || query,
        suggestedTerms: [
          ...(expansion.suggestedTerms || []),
          ...(expansion.legalConcepts || []),
          ...(expansion.synonyms || [])
        ]
      }
    } catch (parseError) {
      console.warn(`[SemanticSearch] Failed to parse query expansion, using original query`)
      return { expandedQuery: query, suggestedTerms: [] }
    }
    
  } catch (error) {
    console.error(`[SemanticSearch] Error expanding query:`, error)
    return { expandedQuery: query, suggestedTerms: [] }
  }
}

/**
 * Perform traditional text search using PostgreSQL full-text search
 */
async function performTextSearch(
  projectId: string, 
  query: string, 
  filters: SearchFilters,
  limit: number = 20
): Promise<SearchResult[]> {
  try {
    console.log(`[SemanticSearch] Performing text search for: "${query}"`)
    
    let searchQuery = supabase
      .from('processed_content')
      .select(`
        file_id,
        files!inner(name, metadata),
        document_type,
        ai_summary,
        extracted_text
      `)
      .eq('project_id', projectId)
      .textSearch('extracted_text', query, { config: 'english' })
    
    // Apply filters
    if (filters.documentTypes && filters.documentTypes.length > 0) {
      searchQuery = searchQuery.in('document_type', filters.documentTypes)
    }
    
    if (filters.confidenceThreshold) {
      searchQuery = searchQuery.gte('confidence_scores->overallAnalysis', filters.confidenceThreshold)
    }
    
    const { data, error } = await searchQuery.limit(limit)
    
    if (error) {
      throw new Error(`Text search failed: ${error.message}`)
    }
    
    const results: SearchResult[] = (data || []).map(item => ({
      file_id: item.file_id,
      file_name: item.files?.name || 'Unknown',
      document_type: item.document_type || 'unknown',
      ai_summary: item.ai_summary || '',
      similarity_score: 0.8, // Placeholder for text search
      extracted_text: item.extracted_text || '',
      metadata: item.files?.metadata
    }))
    
    console.log(`[SemanticSearch] Text search returned ${results.length} results`)
    return results
    
  } catch (error) {
    console.error(`[SemanticSearch] Text search error:`, error)
    return []
  }
}

/**
 * Perform semantic search using vector embeddings
 */
async function performSemanticSearch(
  projectId: string, 
  query: string, 
  filters: SearchFilters,
  limit: number = 20,
  similarityThreshold: number = 0.7
): Promise<SearchResult[]> {
  try {
    console.log(`[SemanticSearch] Performing semantic search for: "${query}"`)
    
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbeddings(query)
    
    // Call the database function for semantic search
    const { data, error } = await supabase
      .rpc('search_documents_semantic', {
        p_project_id: projectId,
        p_query_embedding: `[${queryEmbedding.join(',')}]`,
        p_similarity_threshold: similarityThreshold,
        p_limit: limit
      })
    
    if (error) {
      throw new Error(`Semantic search failed: ${error.message}`)
    }
    
    let results: SearchResult[] = (data || []).map(item => ({
      file_id: item.file_id,
      file_name: item.file_name,
      document_type: item.document_type || 'unknown',
      ai_summary: item.ai_summary || '',
      similarity_score: item.similarity_score,
      extracted_text: item.extracted_text || ''
    }))
    
    // Apply additional filters
    if (filters.documentTypes && filters.documentTypes.length > 0) {
      results = results.filter(r => filters.documentTypes!.includes(r.document_type))
    }
    
    if (filters.parties && filters.parties.length > 0) {
      // This would require checking parties_mentioned in processed_content
      // For now, we'll filter based on text content
      results = results.filter(r => 
        filters.parties!.some(party => 
          r.extracted_text.toLowerCase().includes(party.toLowerCase()) ||
          r.ai_summary.toLowerCase().includes(party.toLowerCase())
        )
      )
    }
    
    console.log(`[SemanticSearch] Semantic search returned ${results.length} results`)
    return results
    
  } catch (error) {
    console.error(`[SemanticSearch] Semantic search error:`, error)
    return []
  }
}

/**
 * Combine and rank results from different search methods
 */
function combineSearchResults(
  textResults: SearchResult[], 
  semanticResults: SearchResult[]
): SearchResult[] {
  const combinedMap = new Map<string, SearchResult>()
  
  // Add semantic results (higher priority)
  semanticResults.forEach(result => {
    combinedMap.set(result.file_id, {
      ...result,
      similarity_score: result.similarity_score * 1.2 // Boost semantic matches
    })
  })
  
  // Add text results (lower priority if not already present)
  textResults.forEach(result => {
    if (!combinedMap.has(result.file_id)) {
      combinedMap.set(result.file_id, result)
    } else {
      // If already present from semantic search, boost the score
      const existing = combinedMap.get(result.file_id)!
      existing.similarity_score = Math.min(existing.similarity_score + 0.1, 1.0)
    }
  })
  
  // Sort by similarity score and return
  return Array.from(combinedMap.values())
    .sort((a, b) => b.similarity_score - a.similarity_score)
}

/**
 * Generate highlighted snippets for search results
 */
function generateHighlightedText(text: string, query: string, maxLength: number = 300): string {
  if (!text || !query) return text?.substring(0, maxLength) || ''
  
  const queryTerms = query.toLowerCase().split(/\s+/)
  const lowerText = text.toLowerCase()
  
  // Find the first occurrence of any query term
  let bestIndex = -1
  let bestTerm = ''
  
  for (const term of queryTerms) {
    const index = lowerText.indexOf(term)
    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index
      bestTerm = term
    }
  }
  
  if (bestIndex === -1) {
    return text.substring(0, maxLength) + '...'
  }
  
  // Extract context around the match
  const start = Math.max(0, bestIndex - 100)
  const end = Math.min(text.length, bestIndex + maxLength)
  let snippet = text.substring(start, end)
  
  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'
  
  // Simple highlighting (replace with HTML tags if needed)
  queryTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi')
    snippet = snippet.replace(regex, '**$1**')
  })
  
  return snippet
}

/**
 * Log search analytics for improvement
 */
async function logSearchAnalytics(
  projectId: string,
  userId: string,
  query: string,
  searchType: string,
  resultsCount: number,
  searchDurationMs: number,
  expandedQuery?: string,
  suggestedTerms?: string[]
) {
  try {
    await supabase
      .from('search_analytics')
      .insert({
        project_id: projectId,
        user_id: userId,
        search_query: query,
        search_type: searchType,
        results_count: resultsCount,
        search_duration_ms: searchDurationMs,
        query_expansion: expandedQuery,
        suggested_terms: suggestedTerms
      })
  } catch (error) {
    console.warn(`[SemanticSearch] Failed to log search analytics:`, error)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const { 
      action, 
      project_id, 
      query, 
      search_type = 'hybrid',
      filters = {},
      limit = 20,
      similarity_threshold = 0.7 
    } = await req.json()
    
    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization')
    let userId = 'anonymous'
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      userId = user?.id || 'anonymous'
    }
    
    if (action === 'search') {
      if (!project_id || !query) {
        throw new Error('project_id and query are required')
      }
      
      console.log(`[SemanticSearch] Starting ${search_type} search for: "${query}"`)
      
      // Expand query with legal terms
      const { expandedQuery, suggestedTerms } = await expandLegalQuery(query)
      
      let results: SearchResult[] = []
      
      if (search_type === 'text') {
        // Traditional text search only
        results = await performTextSearch(project_id, query, filters, limit)
        
      } else if (search_type === 'semantic') {
        // Vector search only
        results = await performSemanticSearch(project_id, expandedQuery, filters, limit, similarity_threshold)
        
      } else if (search_type === 'hybrid') {
        // Combine both approaches
        const [textResults, semanticResults] = await Promise.all([
          performTextSearch(project_id, query, filters, Math.ceil(limit / 2)),
          performSemanticSearch(project_id, expandedQuery, filters, Math.ceil(limit / 2), similarity_threshold)
        ])
        
        results = combineSearchResults(textResults, semanticResults).slice(0, limit)
        
      } else {
        throw new Error(`Invalid search_type: ${search_type}`)
      }
      
      // Generate highlighted text for results
      results = results.map(result => ({
        ...result,
        highlighted_text: generateHighlightedText(result.extracted_text, query)
      }))
      
      const searchDuration = Date.now() - startTime
      
      // Log analytics
      await logSearchAnalytics(
        project_id,
        userId,
        query,
        search_type,
        results.length,
        searchDuration,
        expandedQuery,
        suggestedTerms
      )
      
      console.log(`[SemanticSearch] Search completed in ${searchDuration}ms with ${results.length} results`)
      
      return new Response(
        JSON.stringify({
          success: true,
          results,
          query_expansion: {
            expanded_query: expandedQuery,
            suggested_terms: suggestedTerms
          },
          search_metadata: {
            search_type,
            results_count: results.length,
            search_duration_ms: searchDuration,
            similarity_threshold
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (action === 'similar_documents') {
      // Find documents similar to a given document
      const { file_id, similarity_threshold = 0.8, limit = 10 } = await req.json()
      
      if (!project_id || !file_id) {
        throw new Error('project_id and file_id are required')
      }
      
      // Get the embedding of the reference document
      const { data: refDoc, error: refError } = await supabase
        .from('processed_content')
        .select('content_embedding, ai_summary')
        .eq('file_id', file_id)
        .single()
      
      if (refError || !refDoc?.content_embedding) {
        throw new Error('Reference document not found or not processed')
      }
      
      // Find similar documents
      const { data: similar, error: similarError } = await supabase
        .rpc('search_documents_semantic', {
          p_project_id: project_id,
          p_query_embedding: refDoc.content_embedding,
          p_similarity_threshold: similarity_threshold,
          p_limit: limit + 1 // +1 to exclude the reference document
        })
      
      if (similarError) {
        throw new Error(`Similar document search failed: ${similarError.message}`)
      }
      
      // Filter out the reference document
      const results = (similar || [])
        .filter(doc => doc.file_id !== file_id)
        .slice(0, limit)
      
      return new Response(
        JSON.stringify({
          success: true,
          results,
          reference_summary: refDoc.ai_summary
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    throw new Error(`Unknown action: ${action}`)
    
  } catch (error) {
    console.error('[SemanticSearch] Error:', error)
    
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

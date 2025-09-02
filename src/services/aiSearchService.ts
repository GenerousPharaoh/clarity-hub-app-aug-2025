import { supabase } from '../lib/supabase';

export interface SearchFilters {
  documentTypes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  parties?: string[];
  legalTerms?: string[];
  confidenceThreshold?: number;
}

export interface SearchResult {
  file_id: string;
  file_name: string;
  document_type: string;
  ai_summary: string;
  similarity_score: number;
  extracted_text: string;
  highlighted_text?: string;
  metadata?: any;
}

export interface SearchResponse {
  results: SearchResult[];
  query_expansion: {
    expanded_query: string;
    suggested_terms: string[];
  };
  search_metadata: {
    search_type: string;
    results_count: number;
    search_duration_ms: number;
    similarity_threshold: number;
  };
}

export interface SimilarDocumentsResponse {
  results: SearchResult[];
  reference_summary: string;
}

class AISearchService {
  /**
   * Perform AI-powered search across documents in a project
   */
  async searchDocuments(
    projectId: string,
    query: string,
    options: {
      searchType?: 'text' | 'semantic' | 'hybrid';
      filters?: SearchFilters;
      limit?: number;
      similarityThreshold?: number;
    } = {}
  ): Promise<SearchResponse> {
    const {
      searchType = 'hybrid',
      filters = {},
      limit = 20,
      similarityThreshold = 0.7
    } = options;

    console.log(`[AISearchService] Searching documents in project ${projectId} with query: "${query}"`);

    try {
      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: {
          action: 'search',
          project_id: projectId,
          query,
          search_type: searchType,
          filters,
          limit,
          similarity_threshold: similarityThreshold
        }
      });

      if (error) {
        console.error('[AISearchService] Search error:', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(`Search failed: ${data?.error || 'Unknown error'}`);
      }

      console.log(`[AISearchService] Search completed with ${data.results.length} results`);
      return data;

    } catch (error) {
      console.error('[AISearchService] Error in searchDocuments:', error);
      throw error;
    }
  }

  /**
   * Find documents similar to a given document
   */
  async findSimilarDocuments(
    projectId: string,
    fileId: string,
    options: {
      similarityThreshold?: number;
      limit?: number;
    } = {}
  ): Promise<SimilarDocumentsResponse> {
    const {
      similarityThreshold = 0.8,
      limit = 10
    } = options;

    console.log(`[AISearchService] Finding similar documents to file ${fileId}`);

    try {
      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: {
          action: 'similar_documents',
          project_id: projectId,
          file_id: fileId,
          similarity_threshold: similarityThreshold,
          limit
        }
      });

      if (error) {
        console.error('[AISearchService] Similar documents search error:', error);
        throw new Error(`Similar documents search failed: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(`Similar documents search failed: ${data?.error || 'Unknown error'}`);
      }

      console.log(`[AISearchService] Found ${data.results.length} similar documents`);
      return data;

    } catch (error) {
      console.error('[AISearchService] Error in findSimilarDocuments:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on current query
   */
  async getSearchSuggestions(
    projectId: string,
    partialQuery: string
  ): Promise<string[]> {
    console.log(`[AISearchService] Getting search suggestions for: "${partialQuery}"`);

    try {
      // For now, return basic suggestions based on the partial query
      // In a full implementation, this could query previous search analytics
      // or use AI to suggest completions
      
      const { data, error } = await supabase
        .from('search_analytics')
        .select('search_query, suggested_terms')
        .eq('project_id', projectId)
        .ilike('search_query', `${partialQuery}%`)
        .limit(10);

      if (error) {
        console.warn('[AISearchService] Failed to get search suggestions:', error);
        return [];
      }

      const suggestions = new Set<string>();
      
      // Add related queries
      data?.forEach(record => {
        if (record.search_query && record.search_query !== partialQuery) {
          suggestions.add(record.search_query);
        }
        
        // Add suggested terms
        record.suggested_terms?.forEach(term => {
          if (term.toLowerCase().includes(partialQuery.toLowerCase())) {
            suggestions.add(term);
          }
        });
      });

      return Array.from(suggestions).slice(0, 5);

    } catch (error) {
      console.error('[AISearchService] Error in getSearchSuggestions:', error);
      return [];
    }
  }

  /**
   * Get search analytics for a project
   */
  async getSearchAnalytics(
    projectId: string,
    dateRange?: { start: string; end: string }
  ): Promise<{
    totalSearches: number;
    popularQueries: Array<{ query: string; count: number }>;
    averageResultsCount: number;
    searchTypes: Array<{ type: string; count: number }>;
  }> {
    console.log(`[AISearchService] Getting search analytics for project ${projectId}`);

    try {
      let query = supabase
        .from('search_analytics')
        .select('search_query, search_type, results_count, created_at')
        .eq('project_id', projectId);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Analytics query failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          totalSearches: 0,
          popularQueries: [],
          averageResultsCount: 0,
          searchTypes: []
        };
      }

      // Process analytics data
      const queryCount = new Map<string, number>();
      const typeCount = new Map<string, number>();
      let totalResults = 0;

      data.forEach(record => {
        // Count popular queries
        const query = record.search_query;
        queryCount.set(query, (queryCount.get(query) || 0) + 1);

        // Count search types
        const type = record.search_type;
        typeCount.set(type, (typeCount.get(type) || 0) + 1);

        // Sum results for average
        totalResults += record.results_count || 0;
      });

      const popularQueries = Array.from(queryCount.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const searchTypes = Array.from(typeCount.entries())
        .map(([type, count]) => ({ type, count }));

      return {
        totalSearches: data.length,
        popularQueries,
        averageResultsCount: data.length > 0 ? totalResults / data.length : 0,
        searchTypes
      };

    } catch (error) {
      console.error('[AISearchService] Error in getSearchAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get document analysis summary for a project
   */
  async getProjectAnalysisSummary(projectId: string): Promise<{
    totalProcessedDocuments: number;
    documentTypes: Array<{ type: string; count: number }>;
    topParties: Array<{ party: string; count: number }>;
    recentDeadlines: Array<{ date: string; description: string; file_name: string }>;
    processingStats: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
  }> {
    console.log(`[AISearchService] Getting project analysis summary for ${projectId}`);

    try {
      // Get processed content statistics
      const { data: processedData, error: processedError } = await supabase
        .from('processed_content')
        .select(`
          processing_status,
          document_type,
          parties_mentioned,
          deadlines,
          files!inner(name)
        `)
        .eq('project_id', projectId);

      if (processedError) {
        throw new Error(`Failed to get processed content: ${processedError.message}`);
      }

      // Get file processing statistics
      const { data: fileStats, error: fileStatsError } = await supabase
        .from('files')
        .select('processing_status')
        .eq('project_id', projectId);

      if (fileStatsError) {
        console.warn('Failed to get file processing stats:', fileStatsError);
      }

      const processedDocuments = processedData || [];
      const allFiles = fileStats || [];

      // Count document types
      const documentTypes = new Map<string, number>();
      processedDocuments.forEach(doc => {
        if (doc.document_type) {
          documentTypes.set(doc.document_type, (documentTypes.get(doc.document_type) || 0) + 1);
        }
      });

      // Count parties mentioned
      const partyCount = new Map<string, number>();
      processedDocuments.forEach(doc => {
        doc.parties_mentioned?.forEach(party => {
          partyCount.set(party, (partyCount.get(party) || 0) + 1);
        });
      });

      // Get recent deadlines
      const recentDeadlines: Array<{ date: string; description: string; file_name: string }> = [];
      processedDocuments.forEach(doc => {
        doc.deadlines?.forEach(deadline => {
          recentDeadlines.push({
            date: deadline.date,
            description: deadline.description,
            file_name: doc.files?.name || 'Unknown'
          });
        });
      });

      // Sort deadlines by date
      recentDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Count processing statuses
      const processingStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      allFiles.forEach(file => {
        const status = file.processing_status || 'pending';
        if (status in processingStats) {
          processingStats[status as keyof typeof processingStats]++;
        }
      });

      return {
        totalProcessedDocuments: processedDocuments.length,
        documentTypes: Array.from(documentTypes.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        topParties: Array.from(partyCount.entries())
          .map(([party, count]) => ({ party, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        recentDeadlines: recentDeadlines.slice(0, 10),
        processingStats
      };

    } catch (error) {
      console.error('[AISearchService] Error in getProjectAnalysisSummary:', error);
      throw error;
    }
  }

  /**
   * Trigger processing for a specific file
   */
  async triggerFileProcessing(fileId: string, projectId: string): Promise<{ success: boolean; queue_id?: string }> {
    console.log(`[AISearchService] Triggering processing for file ${fileId}`);

    try {
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          action: 'process_file',
          file_id: fileId,
          project_id: projectId
        }
      });

      if (error) {
        throw new Error(`Failed to trigger processing: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('[AISearchService] Error in triggerFileProcessing:', error);
      throw error;
    }
  }

  /**
   * Get processing status for a file
   */
  async getProcessingStatus(fileId: string): Promise<any> {
    console.log(`[AISearchService] Getting processing status for file ${fileId}`);

    try {
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          action: 'get_status',
          file_id: fileId
        }
      });

      if (error) {
        throw new Error(`Failed to get processing status: ${error.message}`);
      }

      return data?.status;

    } catch (error) {
      console.error('[AISearchService] Error in getProcessingStatus:', error);
      throw error;
    }
  }
}

export const aiSearchService = new AISearchService();
export default aiSearchService;
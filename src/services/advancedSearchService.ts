import { supabase as supabaseClient } from '../lib/supabase';
import { SearchFilters } from '../types';

export interface SearchResult {
  id: string;
  file_id: string;
  file_name: string;
  file_type: string;
  content_type: string;
  project_id: string;
  exhibit_id?: string;
  storage_path: string;
  match_text?: string;
  highlighted_text?: string;
  page_number?: number;
  relevance_score: number;
  context_before?: string;
  context_after?: string;
  created_at: string;
  tags?: string[];
  evidence_status?: string;
  author?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  includeContent?: boolean;
  sortBy?: 'relevance' | 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchSuggestion {
  type: 'term' | 'entity' | 'tag' | 'file';
  value: string;
  count?: number;
  category?: string;
}

export interface SavedSearchQuery {
  id: string;
  name: string;
  query_filters: SearchFilters;
  is_global: boolean;
  usage_count: number;
  last_used_at: string;
  created_at: string;
}

class AdvancedSearchService {
  /**
   * Perform advanced search across document contents and metadata
   */
  async searchDocuments(
    projectId: string,
    filters: SearchFilters,
    options: SearchOptions = {}
  ): Promise<{
    results: SearchResult[];
    total: number;
    suggestions?: SearchSuggestion[];
  }> {
    try {
      const {
        limit = 20,
        offset = 0,
        includeContent = true,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = options;

      // Log the search for analytics
      await this.logSearch(projectId, filters);

      let query = supabaseClient
        .from('files')
        .select(`
          id,
          name,
          file_type,
          content_type,
          project_id,
          exhibit_id,
          storage_path,
          added_at,
          metadata,
          file_tags(tag),
          evidence_records(evidence_type, exhibit_number, is_privileged),
          file_content_search(extracted_text, page_number, text_embedding)
        `)
        .eq('project_id', projectId);

      // Apply filters
      if (filters.searchTerm) {
        if (filters.searchType === 'semantic') {
          // Use vector similarity search
          query = await this.applySemanticSearch(query, filters.searchTerm);
        } else if (filters.searchType === 'exact') {
          // Exact phrase search
          query = query.textSearch('file_content_search.extracted_text', `"${filters.searchTerm}"`);
        } else {
          // Combined search (default) - use full-text search
          query = query.textSearch('file_content_search.extracted_text', filters.searchTerm);
        }
      }

      if (filters.fileTypes?.length) {
        query = query.in('file_type', filters.fileTypes);
      }

      if (filters.tags?.length) {
        query = query.in('file_tags.tag', filters.tags);
      }

      if (filters.entities?.length) {
        // Search for entities in document chunks
        const entityQuery = supabaseClient
          .from('entities')
          .select('source_file_id')
          .eq('project_id', projectId)
          .in('entity_text', filters.entities);
        
        const { data: entityFiles } = await entityQuery;
        if (entityFiles?.length) {
          const fileIds = entityFiles.map(e => e.source_file_id);
          query = query.in('id', fileIds);
        }
      }

      if (filters.dateFrom) {
        query = query.gte('added_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('added_at', filters.dateTo);
      }

      // Apply sorting
      if (sortBy === 'relevance' && filters.searchTerm) {
        // PostgreSQL ts_rank for relevance scoring
        query = query.order('ts_rank(to_tsvector(file_content_search.extracted_text), plainto_tsquery($1))', 
          { ascending: sortOrder === 'asc', nullsFirst: false });
      } else if (sortBy === 'date') {
        query = query.order('added_at', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('name', { ascending: sortOrder === 'asc' });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: files, error, count } = await query;

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      // Process results and add highlights
      const results = await this.processSearchResults(
        files || [],
        filters.searchTerm,
        includeContent
      );

      // Get search suggestions if no specific search term
      const suggestions = !filters.searchTerm 
        ? await this.getSearchSuggestions(projectId)
        : undefined;

      return {
        results,
        total: count || 0,
        suggestions
      };

    } catch (error) {
      console.error('Error in searchDocuments:', error);
      throw error;
    }
  }

  /**
   * Apply semantic search using vector embeddings
   */
  private async applySemanticSearch(query: any, searchTerm: string) {
    // For semantic search, we would typically:
    // 1. Generate embedding for the search term
    // 2. Use vector similarity search
    // For now, we'll fall back to text search
    return query.textSearch('file_content_search.extracted_text', searchTerm);
  }

  /**
   * Process search results and add highlighting
   */
  private async processSearchResults(
    files: any[],
    searchTerm?: string,
    includeContent: boolean = true
  ): Promise<SearchResult[]> {
    return files.map(file => {
      const contentSearch = file.file_content_search?.[0];
      const tags = file.file_tags?.map((tag: any) => tag.tag) || [];
      const evidence = file.evidence_records?.[0];

      let highlighted_text = '';
      let context_before = '';
      let context_after = '';

      if (searchTerm && contentSearch?.extracted_text) {
        const text = contentSearch.extracted_text;
        const searchRegex = new RegExp(`(${searchTerm})`, 'gi');
        const match = text.match(searchRegex);
        
        if (match) {
          const matchIndex = text.toLowerCase().indexOf(searchTerm.toLowerCase());
          const contextLength = 100;
          
          context_before = text.substring(
            Math.max(0, matchIndex - contextLength),
            matchIndex
          );
          
          highlighted_text = text.substring(
            matchIndex,
            matchIndex + searchTerm.length
          );
          
          context_after = text.substring(
            matchIndex + searchTerm.length,
            Math.min(text.length, matchIndex + searchTerm.length + contextLength)
          );
        }
      }

      return {
        id: file.id,
        file_id: file.id,
        file_name: file.name,
        file_type: file.file_type,
        content_type: file.content_type,
        project_id: file.project_id,
        exhibit_id: file.exhibit_id,
        storage_path: file.storage_path,
        match_text: contentSearch?.extracted_text?.substring(0, 300) || '',
        highlighted_text,
        page_number: contentSearch?.page_number,
        relevance_score: searchTerm ? this.calculateRelevanceScore(file, searchTerm) : 1.0,
        context_before,
        context_after,
        created_at: file.added_at,
        tags,
        evidence_status: evidence?.evidence_type,
        author: file.metadata?.author || 'Unknown'
      };
    });
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(file: any, searchTerm: string): number {
    let score = 0.5; // Base score

    // Higher score for matches in filename
    if (file.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      score += 0.3;
    }

    // Higher score for exact matches in content
    const content = file.file_content_search?.[0]?.extracted_text || '';
    const exactMatches = (content.toLowerCase().match(new RegExp(searchTerm.toLowerCase(), 'g')) || []).length;
    score += Math.min(exactMatches * 0.1, 0.4);

    // Bonus for recent files
    const daysSinceAdded = (Date.now() - new Date(file.added_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAdded < 7) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get search suggestions based on project data
   */
  async getSearchSuggestions(projectId: string): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      // Get recent search terms
      const { data: recentSearches } = await supabaseClient
        .from('recent_searches')
        .select('search_term')
        .eq('project_id', projectId)
        .order('searched_at', { ascending: false })
        .limit(5);

      recentSearches?.forEach(search => {
        if (search.search_term.trim()) {
          suggestions.push({
            type: 'term',
            value: search.search_term,
            category: 'Recent'
          });
        }
      });

      // Get popular tags
      const { data: tags } = await supabaseClient
        .from('file_tags')
        .select('tag, count(*)')
        .eq('project_id', projectId)
        .group('tag')
        .order('count', { ascending: false })
        .limit(5);

      tags?.forEach(tag => {
        suggestions.push({
          type: 'tag',
          value: tag.tag,
          count: tag.count,
          category: 'Tags'
        });
      });

      // Get common entities
      const { data: entities } = await supabaseClient
        .from('entities')
        .select('entity_text, entity_type, count(*)')
        .eq('project_id', projectId)
        .group('entity_text, entity_type')
        .order('count', { ascending: false })
        .limit(5);

      entities?.forEach(entity => {
        suggestions.push({
          type: 'entity',
          value: entity.entity_text,
          count: entity.count,
          category: entity.entity_type
        });
      });

      return suggestions;

    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Save a search query for reuse
   */
  async saveSearchQuery(
    projectId: string,
    name: string,
    filters: SearchFilters,
    isGlobal: boolean = false
  ): Promise<SavedSearchQuery> {
    try {
      const { data, error } = await supabaseClient
        .from('saved_search_queries')
        .insert({
          project_id: projectId,
          name,
          query_filters: filters,
          is_global: isGlobal
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error saving search query:', error);
      throw error;
    }
  }

  /**
   * Get saved search queries
   */
  async getSavedSearchQueries(projectId: string): Promise<SavedSearchQuery[]> {
    try {
      const { data, error } = await supabaseClient
        .from('saved_search_queries')
        .select('*')
        .eq('project_id', projectId)
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting saved search queries:', error);
      return [];
    }
  }

  /**
   * Update saved search query usage
   */
  async updateSearchQueryUsage(queryId: string): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('saved_search_queries')
        .update({
          usage_count: supabaseClient.sql`usage_count + 1`,
          last_used_at: new Date().toISOString()
        })
        .eq('id', queryId);

      if (error) throw error;

    } catch (error) {
      console.error('Error updating search query usage:', error);
    }
  }

  /**
   * Delete saved search query
   */
  async deleteSearchQuery(queryId: string): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('saved_search_queries')
        .delete()
        .eq('id', queryId);

      if (error) throw error;

    } catch (error) {
      console.error('Error deleting search query:', error);
      throw error;
    }
  }

  /**
   * Log search for analytics
   */
  private async logSearch(projectId: string, filters: SearchFilters): Promise<void> {
    try {
      // Log to recent searches
      if (filters.searchTerm) {
        await supabaseClient
          .from('recent_searches')
          .insert({
            project_id: projectId,
            search_term: filters.searchTerm,
            search_filters: filters
          });

        // Clean up old recent searches (keep only last 50 per user per project)
        const { data: oldSearches } = await supabaseClient
          .from('recent_searches')
          .select('id')
          .eq('project_id', projectId)
          .order('searched_at', { ascending: false })
          .range(50, 999);

        if (oldSearches?.length) {
          const idsToDelete = oldSearches.map(s => s.id);
          await supabaseClient
            .from('recent_searches')
            .delete()
            .in('id', idsToDelete);
        }
      }

      // Log to activity logs
      await supabaseClient
        .from('activity_logs')
        .insert({
          project_id: projectId,
          action_type: 'search',
          resource_type: 'search',
          metadata: {
            search_type: filters.searchType,
            has_filters: Object.keys(filters).length > 1,
            filter_types: Object.keys(filters).filter(k => filters[k as keyof SearchFilters] !== undefined && filters[k as keyof SearchFilters] !== null && filters[k as keyof SearchFilters] !== '')
          }
        });

    } catch (error) {
      console.error('Error logging search:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Extract text content from files for search indexing
   */
  async indexFileContent(fileId: string, content: string, pageNumber?: number): Promise<void> {
    try {
      const { data: file } = await supabaseClient
        .from('files')
        .select('project_id, owner_id')
        .eq('id', fileId)
        .single();

      if (!file) return;

      await supabaseClient
        .from('file_content_search')
        .upsert({
          file_id: fileId,
          project_id: file.project_id,
          owner_id: file.owner_id,
          extracted_text: content,
          page_number: pageNumber,
          indexed_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error indexing file content:', error);
      throw error;
    }
  }

  /**
   * Add tags to a file
   */
  async addFileTags(fileId: string, tags: string[]): Promise<void> {
    try {
      const { data: file } = await supabaseClient
        .from('files')
        .select('project_id, owner_id')
        .eq('id', fileId)
        .single();

      if (!file) return;

      const tagInserts = tags.map(tag => ({
        file_id: fileId,
        project_id: file.project_id,
        owner_id: file.owner_id,
        tag: tag.trim().toLowerCase()
      }));

      await supabaseClient
        .from('file_tags')
        .upsert(tagInserts, { onConflict: 'file_id,tag' });

    } catch (error) {
      console.error('Error adding file tags:', error);
      throw error;
    }
  }

  /**
   * Remove tags from a file
   */
  async removeFileTags(fileId: string, tags: string[]): Promise<void> {
    try {
      await supabaseClient
        .from('file_tags')
        .delete()
        .eq('file_id', fileId)
        .in('tag', tags);

    } catch (error) {
      console.error('Error removing file tags:', error);
      throw error;
    }
  }

  /**
   * Get all tags for a project
   */
  async getProjectTags(projectId: string): Promise<string[]> {
    try {
      const { data, error } = await supabaseClient
        .from('file_tags')
        .select('tag')
        .eq('project_id', projectId)
        .order('tag');

      if (error) throw error;

      return [...new Set(data?.map(item => item.tag) || [])];

    } catch (error) {
      console.error('Error getting project tags:', error);
      return [];
    }
  }
}

export const advancedSearchService = new AdvancedSearchService();
export default advancedSearchService;
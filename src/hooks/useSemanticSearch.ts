import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiSearchService, SearchFilters, SearchResult, SearchResponse } from '../services/aiSearchService';

export interface UseSemanticSearchOptions {
  projectId: string;
  enabled?: boolean;
  searchType?: 'text' | 'semantic' | 'hybrid';
  similarityThreshold?: number;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
  searchMetadata?: {
    search_type: string;
    results_count: number;
    search_duration_ms: number;
    similarity_threshold: number;
  };
  queryExpansion?: {
    expanded_query: string;
    suggested_terms: string[];
  };
}

export function useSemanticSearch(options: UseSemanticSearchOptions) {
  const { projectId, enabled = true, searchType = 'hybrid', similarityThreshold = 0.7 } = options;
  const queryClient = useQueryClient();

  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    filters: {},
    results: [],
    isSearching: false,
    error: null
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async ({
      query,
      filters = {},
      limit = 20
    }: {
      query: string;
      filters?: SearchFilters;
      limit?: number;
    }) => {
      return aiSearchService.searchDocuments(projectId, query, {
        searchType,
        filters,
        limit,
        similarityThreshold
      });
    },
    onMutate: () => {
      setSearchState(prev => ({
        ...prev,
        isSearching: true,
        error: null
      }));
    },
    onSuccess: (data: SearchResponse) => {
      setSearchState(prev => ({
        ...prev,
        results: data.results,
        isSearching: false,
        searchMetadata: data.search_metadata,
        queryExpansion: data.query_expansion
      }));
    },
    onError: (error: Error) => {
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        error: error.message,
        results: []
      }));
    }
  });

  // Search function
  const search = useCallback(
    (query: string, filters: SearchFilters = {}, limit: number = 20) => {
      if (!query.trim()) {
        setSearchState(prev => ({
          ...prev,
          results: [],
          error: null,
          searchMetadata: undefined,
          queryExpansion: undefined
        }));
        return;
      }

      setSearchState(prev => ({
        ...prev,
        query: query.trim(),
        filters
      }));

      searchMutation.mutate({ query: query.trim(), filters, limit });
    },
    [searchMutation]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      filters: {},
      results: [],
      isSearching: false,
      error: null
    });
  }, []);

  return {
    ...searchState,
    search,
    clearSearch,
    isLoading: searchMutation.isPending
  };
}

export function useSimilarDocuments(projectId: string, fileId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['similar_documents', projectId, fileId],
    queryFn: async () => {
      if (!fileId) return null;
      
      return aiSearchService.findSimilarDocuments(projectId, fileId, {
        similarityThreshold: 0.8,
        limit: 10
      });
    },
    enabled: enabled && !!fileId && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}

export function useSearchSuggestions(projectId: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = useCallback(
    async (partialQuery: string) => {
      if (!partialQuery.trim() || partialQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await aiSearchService.getSearchSuggestions(projectId, partialQuery.trim());
        setSuggestions(results);
      } catch (error) {
        console.error('Error getting search suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  return {
    suggestions,
    isLoading,
    getSuggestions,
    clearSuggestions: () => setSuggestions([])
  };
}

export function useSearchAnalytics(
  projectId: string, 
  dateRange?: { start: string; end: string },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['search_analytics', projectId, dateRange],
    queryFn: async () => {
      return aiSearchService.getSearchAnalytics(projectId, dateRange);
    },
    enabled: enabled && !!projectId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });
}

export function useProjectAnalysisSummary(projectId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['project_analysis_summary', projectId],
    queryFn: async () => {
      return aiSearchService.getProjectAnalysisSummary(projectId);
    },
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds to show processing progress
    refetchOnWindowFocus: false
  });
}

export function useFileProcessing(fileId: string, projectId: string) {
  const queryClient = useQueryClient();

  const triggerProcessing = useMutation({
    mutationFn: async () => {
      return aiSearchService.triggerFileProcessing(fileId, projectId);
    },
    onSuccess: () => {
      // Invalidate processing status queries
      queryClient.invalidateQueries({ queryKey: ['file_processing_status', fileId] });
      queryClient.invalidateQueries({ queryKey: ['processed_content', fileId] });
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    }
  });

  return {
    triggerProcessing: triggerProcessing.mutate,
    isTriggering: triggerProcessing.isPending,
    error: triggerProcessing.error?.message
  };
}
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Typography,
  Divider,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as ClearIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Tag as TagIcon,
  Person as PersonIcon,
  InsertDriveFile as FileIcon,
  FilterList as FilterIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { debounce } from 'lodash';
import useAppStore from '../../../store';
import { advancedSearchService, SearchSuggestion } from '../../../services/advancedSearchService';

interface SmartSearchBoxProps {
  onSearch: (searchTerm: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  showSaveOption?: boolean;
  showFilters?: boolean;
}

const SmartSearchBox: React.FC<SmartSearchBoxProps> = ({
  onSearch,
  onSuggestionSelect,
  placeholder = "Search documents, content, or ask AI...",
  showSaveOption = true,
  showFilters = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const searchFilters = useAppStore(state => state.searchFilters);
  const setSearchFilters = useAppStore(state => state.setSearchFilters);

  // Debounced function to get suggestions
  const debouncedGetSuggestions = useCallback(
    debounce(async (term: string, projectId: string) => {
      if (!term.trim() || term.length < 2) {
        if (!term.trim() && projectId) {
          // Show general suggestions when search is empty
          try {
            const generalSuggestions = await advancedSearchService.getSearchSuggestions(projectId);
            setSuggestions(generalSuggestions);
          } catch (error) {
            console.error('Error getting general suggestions:', error);
          }
        } else {
          setSuggestions([]);
        }
        setIsLoading(false);
        return;
      }

      try {
        const searchSuggestions = await advancedSearchService.getSearchSuggestions(projectId);
        
        // Filter suggestions based on search term
        const filteredSuggestions = searchSuggestions.filter(suggestion =>
          suggestion.value.toLowerCase().includes(term.toLowerCase())
        );

        // Add search term as first suggestion if it's not already there
        const termSuggestion: SearchSuggestion = {
          type: 'term',
          value: term,
          category: 'Search'
        };

        const combinedSuggestions = [termSuggestion, ...filteredSuggestions]
          .slice(0, 8); // Limit to 8 suggestions

        setSuggestions(combinedSuggestions);
      } catch (error) {
        console.error('Error getting search suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Load recent searches on component mount
  useEffect(() => {
    if (selectedProjectId) {
      loadRecentSearches(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Get suggestions when search term changes
  useEffect(() => {
    if (selectedProjectId) {
      setIsLoading(true);
      debouncedGetSuggestions(searchTerm, selectedProjectId);
    }
  }, [searchTerm, selectedProjectId, debouncedGetSuggestions]);

  // Update search term from store
  useEffect(() => {
    if (searchFilters.searchTerm !== searchTerm) {
      setSearchTerm(searchFilters.searchTerm || '');
    }
  }, [searchFilters.searchTerm]);

  const loadRecentSearches = async (projectId: string) => {
    try {
      const suggestions = await advancedSearchService.getSearchSuggestions(projectId);
      const recentTerms = suggestions
        .filter(s => s.type === 'term' && s.category === 'Recent')
        .map(s => s.value)
        .slice(0, 5);
      setRecentSearches(recentTerms);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
    if (selectedProjectId && !searchTerm.trim()) {
      debouncedGetSuggestions('', selectedProjectId);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSearchFilters({ searchTerm: searchTerm.trim() });
      onSearch(searchTerm.trim());
      setShowSuggestions(false);
      
      // Add to recent searches
      if (!recentSearches.includes(searchTerm.trim())) {
        setRecentSearches(prev => [searchTerm.trim(), ...prev.slice(0, 4)]);
      }
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchFilters({ searchTerm: '' });
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.value);
    setSearchFilters({ searchTerm: suggestion.value });
    setShowSuggestions(false);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else {
      onSearch(suggestion.value);
    }

    // Add to recent searches
    if (!recentSearches.includes(suggestion.value)) {
      setRecentSearches(prev => [suggestion.value, ...prev.slice(0, 4)]);
    }
  };

  const handleSaveSearch = () => {
    // This would open a dialog to save the current search query
    console.log('Save search functionality to be implemented');
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'term':
        return <SearchIcon fontSize="small" />;
      case 'entity':
        return <PersonIcon fontSize="small" />;
      case 'tag':
        return <TagIcon fontSize="small" />;
      case 'file':
        return <FileIcon fontSize="small" />;
      default:
        return <SearchIcon fontSize="small" />;
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'entity':
        return 'primary';
      case 'tag':
        return 'secondary';
      case 'file':
        return 'success';
      default:
        return 'default';
    }
  };

  const hasActiveFilters = () => {
    return (
      (searchFilters.fileTypes?.length || 0) > 0 ||
      (searchFilters.tags?.length || 0) > 0 ||
      (searchFilters.entities?.length || 0) > 0 ||
      searchFilters.dateFrom ||
      searchFilters.dateTo
    );
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        ref={searchInputRef}
        fullWidth
        variant="outlined"
        size="medium"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showFilters && hasActiveFilters() && (
                  <Tooltip title="Active filters">
                    <Badge color="primary" variant="dot">
                      <FilterIcon fontSize="small" color="action" />
                    </Badge>
                  </Tooltip>
                )}
                
                {showSaveOption && searchTerm.trim() && (
                  <Tooltip title="Save search">
                    <IconButton
                      size="small"
                      onClick={handleSaveSearch}
                      sx={{ p: 0.5 }}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {searchTerm && (
                  <Tooltip title="Clear search">
                    <IconButton
                      size="small"
                      onClick={handleClear}
                      sx={{ p: 0.5 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {isLoading && (
                  <CircularProgress size={16} sx={{ ml: 0.5 }} />
                )}
              </Box>
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'action.hover'
            },
            '&.Mui-focused': {
              backgroundColor: 'background.paper'
            }
          }
        }}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <Paper
          ref={suggestionsRef}
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: '400px',
            overflowY: 'auto',
            mt: 0.5,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <List dense sx={{ p: 0 }}>
            {/* Recent searches when input is empty */}
            {!searchTerm.trim() && recentSearches.length > 0 && (
              <>
                <ListItem sx={{ py: 0.5, backgroundColor: 'action.hover' }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <HistoryIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <Typography variant="caption" color="text.secondary">
                    Recent searches
                  </Typography>
                </ListItem>
                {recentSearches.map((term, index) => (
                  <ListItem
                    key={`recent-${index}`}
                    button
                    onClick={() => handleSuggestionClick({ type: 'term', value: term, category: 'Recent' })}
                    sx={{
                      py: 0.5,
                      pl: 3,
                      backgroundColor: selectedSuggestionIndex === index ? 'action.selected' : 'transparent'
                    }}
                  >
                    <ListItemText
                      primary={term}
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                ))}
                {suggestions.length > 0 && <Divider />}
              </>
            )}

            {/* Search suggestions */}
            {suggestions.map((suggestion, index) => {
              const adjustedIndex = !searchTerm.trim() ? index + recentSearches.length : index;
              return (
                <ListItem
                  key={`suggestion-${index}`}
                  button
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{
                    py: 0.5,
                    backgroundColor: selectedSuggestionIndex === adjustedIndex ? 'action.selected' : 'transparent'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getSuggestionIcon(suggestion.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {suggestion.value}
                        </Typography>
                        {suggestion.category && (
                          <Chip
                            label={suggestion.category}
                            size="small"
                            variant="outlined"
                            color={getSuggestionColor(suggestion.type) as any}
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                        {suggestion.count && (
                          <Typography variant="caption" color="text.secondary">
                            ({suggestion.count})
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}

            {suggestions.length === 0 && recentSearches.length === 0 && searchTerm.trim() && (
              <ListItem>
                <ListItemText
                  primary="No suggestions found"
                  primaryTypographyProps={{ color: 'text.secondary', fontSize: '0.875rem' }}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default SmartSearchBox;
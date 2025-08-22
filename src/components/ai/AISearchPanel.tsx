import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Autocomplete,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Card,
  CardContent,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Psychology as PsychologyIcon,
  TextSnippet as TextSnippetIcon,
  Visibility as VisibilityIcon,
  FindInPage as FindInPageIcon,
  AutoAwesome as AutoAwesomeIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { debounce } from 'lodash';
import { useSemanticSearch, useSearchSuggestions, useSearchAnalytics } from '../../hooks/useSemanticSearch';
import { SearchFilters } from '../../services/aiSearchService';

interface AISearchPanelProps {
  projectId: string;
  onFileSelect?: (fileId: string) => void;
  onSearchResults?: (results: any[]) => void;
  className?: string;
}

const DOCUMENT_TYPES = [
  'contract',
  'motion',
  'correspondence', 
  'pleading',
  'discovery',
  'evidence',
  'legal_brief',
  'court_order',
  'deposition',
  'transcript',
  'exhibit',
  'other'
];

const SEARCH_TYPES = [
  { value: 'hybrid', label: 'Smart Search (AI + Text)', icon: <AutoAwesomeIcon /> },
  { value: 'semantic', label: 'AI Semantic Search', icon: <PsychologyIcon /> },
  { value: 'text', label: 'Traditional Text Search', icon: <TextSnippetIcon /> }
];

const AISearchPanel: React.FC<AISearchPanelProps> = ({
  projectId,
  onFileSelect,
  onSearchResults,
  className
}) => {
  const [searchType, setSearchType] = useState<'text' | 'semantic' | 'hybrid'>('hybrid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    documentTypes: [],
    confidenceThreshold: 0.7
  });

  const {
    query,
    results,
    isSearching,
    error,
    searchMetadata,
    queryExpansion,
    search,
    clearSearch
  } = useSemanticSearch({
    projectId,
    searchType,
    similarityThreshold: filters.confidenceThreshold
  });

  const {
    suggestions,
    isLoading: suggestionsLoading,
    getSuggestions,
    clearSuggestions
  } = useSearchSuggestions(projectId);

  const {
    data: analyticsData
  } = useSearchAnalytics(projectId);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        search(searchQuery, filters);
        getSuggestions(searchQuery);
      } else {
        clearSearch();
        clearSuggestions();
      }
    }, 300),
    [search, filters, getSuggestions, clearSearch, clearSuggestions]
  );

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleDocumentTypesChange = (selectedTypes: string[]) => {
    const newFilters = { ...filters, documentTypes: selectedTypes };
    setFilters(newFilters);
    
    if (query) {
      search(query, newFilters);
    }
  };

  const handleConfidenceThresholdChange = (value: number) => {
    const newFilters = { ...filters, confidenceThreshold: value };
    setFilters(newFilters);
    
    if (query) {
      search(query, newFilters);
    }
  };

  // Effect to notify parent of search results
  useEffect(() => {
    if (onSearchResults) {
      onSearchResults(results);
    }
  }, [results, onSearchResults]);

  const formatSimilarityScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getSearchTypeIcon = (type: string) => {
    const searchTypeInfo = SEARCH_TYPES.find(st => st.value === type);
    return searchTypeInfo?.icon || <SearchIcon />;
  };

  return (
    <Box className={className}>
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        {/* Search Header */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <PsychologyIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              AI-Powered Search
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'contained' : 'outlined'}
          >
            Filters
          </Button>
        </Box>

        {/* Search Type Selection */}
        <Box mb={2}>
          <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel>Search Type</InputLabel>
            <Select
              value={searchType}
              label="Search Type"
              onChange={(e) => setSearchType(e.target.value as any)}
              startAdornment={getSearchTypeIcon(searchType)}
            >
              {SEARCH_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Confidence threshold for AI matches">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>AI Confidence</InputLabel>
              <Select
                value={filters.confidenceThreshold}
                label="AI Confidence"
                onChange={(e) => handleConfidenceThresholdChange(e.target.value as number)}
              >
                <MenuItem value={0.5}>50%</MenuItem>
                <MenuItem value={0.6}>60%</MenuItem>
                <MenuItem value={0.7}>70%</MenuItem>
                <MenuItem value={0.8}>80%</MenuItem>
                <MenuItem value={0.9}>90%</MenuItem>
              </Select>
            </FormControl>
          </Tooltip>
        </Box>

        {/* Main Search Input */}
        <Autocomplete
          freeSolo
          options={suggestions}
          loading={suggestionsLoading}
          onInputChange={(event, value) => {
            if (value !== query) {
              debouncedSearch(value);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              placeholder="Search legal documents using AI-powered semantic search..."
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                startAdornment: isSearching ? <CircularProgress size={20} /> : <SearchIcon />,
                endAdornment: (
                  query && (
                    <IconButton size="small" onClick={clearSearch}>
                      <ClearIcon />
                    </IconButton>
                  )
                )
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box display="flex" alignItems="center" gap={1}>
                <SearchIcon fontSize="small" color="action" />
                <Typography variant="body2">{option}</Typography>
              </Box>
            </li>
          )}
        />

        {/* Advanced Filters */}
        {showFilters && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" fontWeight={600}>
                Advanced Search Filters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {/* Document Types Filter */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Document Types
                  </Typography>
                  <FormGroup row>
                    {DOCUMENT_TYPES.map(type => (
                      <FormControlLabel
                        key={type}
                        control={
                          <Checkbox
                            checked={filters.documentTypes?.includes(type) || false}
                            onChange={(e) => {
                              const currentTypes = filters.documentTypes || [];
                              const newTypes = e.target.checked
                                ? [...currentTypes, type]
                                : currentTypes.filter(t => t !== type);
                              handleDocumentTypesChange(newTypes);
                            }}
                            size="small"
                          />
                        }
                        label={type.replace('_', ' ').toUpperCase()}
                      />
                    ))}
                  </FormGroup>
                </FormControl>

                {/* Date Range Filter */}
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    type="date"
                    label="From Date"
                    size="small"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: e.target.value, end: filters.dateRange?.end || '' }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="date"
                    label="To Date"
                    size="small"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: filters.dateRange?.start || '', end: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Query Expansion Display */}
        {queryExpansion && queryExpansion.suggested_terms.length > 0 && (
          <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              AI Enhanced Search Terms:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {queryExpansion.suggested_terms.slice(0, 5).map((term, index) => (
                <Chip
                  key={index}
                  label={term}
                  size="small"
                  variant="outlined"
                  onClick={() => debouncedSearch(term)}
                />
              ))}
            </Box>
          </Alert>
        )}
      </Paper>

      {/* Search Results */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Search failed: {error}
        </Alert>
      )}

      {searchMetadata && (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Box display="flex" alignItems="center" justify="space-between">
            <Typography variant="body2" color="text.secondary">
              Found {searchMetadata.results_count} results in {searchMetadata.search_duration_ms}ms
              using {searchMetadata.search_type} search
            </Typography>
            <Chip
              label={`Min Confidence: ${formatSimilarityScore(searchMetadata.similarity_threshold)}`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Paper>
      )}

      {results.length > 0 && (
        <Paper elevation={1}>
          <List>
            {results.map((result, index) => (
              <React.Fragment key={result.file_id}>
                <ListItemButton
                  onClick={() => onFileSelect?.(result.file_id)}
                  sx={{ alignItems: 'flex-start' }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <FindInPageIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {result.file_name}
                        </Typography>
                        <Chip
                          label={result.document_type || 'unknown'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Badge
                          badgeContent={formatSimilarityScore(result.similarity_score)}
                          color="secondary"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        {result.ai_summary && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1, fontStyle: 'italic' }}
                          >
                            {result.ai_summary}
                          </Typography>
                        )}
                        {result.highlighted_text && (
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{
                              backgroundColor: 'rgba(255, 235, 59, 0.1)',
                              p: 1,
                              borderRadius: 1,
                              fontFamily: 'monospace',
                              fontSize: '0.8rem'
                            }}
                          >
                            {result.highlighted_text}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => onFileSelect?.(result.file_id)}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
                {index < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Popular Search Terms */}
      {analyticsData && analyticsData.popularQueries.length > 0 && !query && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TrendingUpIcon color="action" />
              <Typography variant="subtitle2" fontWeight={600}>
                Popular Search Terms
              </Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {analyticsData.popularQueries.slice(0, 8).map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.query} (${item.count})`}
                  size="small"
                  variant="outlined"
                  onClick={() => debouncedSearch(item.query)}
                  clickable
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {query && results.length === 0 && !isSearching && !error && (
        <Alert severity="info">
          <Typography variant="body2">
            No documents found matching your search criteria. Try:
          </Typography>
          <List dense>
            <ListItem>• Using broader search terms</ListItem>
            <ListItem>• Reducing the AI confidence threshold</ListItem>
            <ListItem>• Removing document type filters</ListItem>
            <ListItem>• Trying different search types</ListItem>
          </List>
        </Alert>
      )}
    </Box>
  );
};

export default AISearchPanel;
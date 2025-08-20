import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  IconButton,
  Button,
  List,
  ListItem,
  Divider,
  Avatar,
  Badge,
  Tooltip,
  LinearProgress,
  Alert,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Description as DocIcon,
  Code as CodeIcon,
  TableChart as SpreadsheetIcon,
  Launch as OpenIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  FileCopy as CopyIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import useAppStore from '../../../store';
import { SearchResult } from '../../../services/advancedSearchService';

interface SearchResultsViewProps {
  results: SearchResult[];
  total: number;
  loading: boolean;
  error?: string;
  onResultClick: (result: SearchResult) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  searchTerm?: string;
}

const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  results,
  total,
  loading,
  error,
  onResultClick,
  onPageChange,
  currentPage,
  pageSize,
  onPageSizeChange,
  searchTerm
}) => {
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'name'>('relevance');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const [contextMenuResult, setContextMenuResult] = useState<SearchResult | null>(null);

  const setSelectedFile = useAppStore(state => state.setSelectedFile);

  const getFileIcon = (fileType: string, contentType: string) => {
    switch (fileType) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'image':
        return <ImageIcon color="primary" />;
      case 'video':
        return <VideoIcon color="secondary" />;
      case 'audio':
        return <AudioIcon color="info" />;
      case 'document':
        if (contentType.includes('word') || contentType.includes('text')) {
          return <DocIcon color="primary" />;
        }
        if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
          return <SpreadsheetIcon color="success" />;
        }
        return <DocIcon color="primary" />;
      case 'code':
        return <CodeIcon color="warning" />;
      default:
        return <FileIcon color="action" />;
    }
  };

  const getFileTypeColor = (fileType: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (fileType) {
      case 'pdf':
        return 'error';
      case 'image':
        return 'primary';
      case 'video':
        return 'secondary';
      case 'audio':
        return 'info';
      case 'document':
        return 'success';
      case 'code':
        return 'warning';
      default:
        return 'default';
    }
  };

  const highlightText = (text: string, searchTerm?: string) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return (
          <Box
            key={index}
            component="span"
            sx={{
              backgroundColor: 'warning.light',
              color: 'warning.contrastText',
              px: 0.5,
              borderRadius: 0.5,
              fontWeight: 'bold'
            }}
          >
            {part}
          </Box>
        );
      }
      return part;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedFile(result.file_id);
    onResultClick(result);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>, result: SearchResult) => {
    event.preventDefault();
    setContextMenuAnchor(event.currentTarget);
    setContextMenuResult(result);
  };

  const handleContextMenuClose = () => {
    setContextMenuAnchor(null);
    setContextMenuResult(null);
  };

  const handleToggleSelect = (resultId: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(results.map(r => r.id)));
    }
  };

  const renderResultCard = (result: SearchResult) => (
    <Card
      key={result.id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: selectedResults.has(result.id) ? 2 : 1,
        borderColor: selectedResults.has(result.id) ? 'primary.main' : 'divider',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-1px)',
          borderColor: 'primary.light'
        }
      }}
      onClick={() => handleResultClick(result)}
      onContextMenu={(e) => handleContextMenu(e, result)}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: `${getFileTypeColor(result.file_type)}.light`
              }}
            >
              {getFileIcon(result.file_type, result.content_type)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {highlightText(result.file_name, searchTerm)}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label={result.file_type.toUpperCase()}
                  size="small"
                  color={getFileTypeColor(result.file_type)}
                  variant="outlined"
                />
                
                {result.exhibit_id && (
                  <Chip
                    label={`Exhibit ${result.exhibit_id}`}
                    size="small"
                    color="primary"
                    variant="filled"
                  />
                )}

                {result.evidence_status && (
                  <Chip
                    icon={<SecurityIcon sx={{ fontSize: 14 }} />}
                    label={result.evidence_status}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}

                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                </Typography>
              </Stack>
            </Box>

            <Stack alignItems="flex-end" spacing={1}>
              <Typography
                variant="caption"
                color="primary"
                sx={{ fontWeight: 600 }}
              >
                {(result.relevance_score * 100).toFixed(0)}% match
              </Typography>
              
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSelect(result.id);
                }}
              >
                {selectedResults.has(result.id) ? 
                  <StarIcon color="primary" /> : 
                  <StarBorderIcon />
                }
              </IconButton>
            </Stack>
          </Stack>

          {/* Content Preview */}
          {result.match_text && (
            <Box
              sx={{
                p: 1.5,
                backgroundColor: 'action.hover',
                borderRadius: 1,
                borderLeft: 3,
                borderLeftColor: 'primary.main'
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Content preview:
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {result.context_before && (
                  <span style={{ opacity: 0.7 }}>...{result.context_before}</span>
                )}
                {result.highlighted_text && (
                  <Box
                    component="span"
                    sx={{
                      backgroundColor: 'warning.light',
                      color: 'warning.contrastText',
                      px: 0.5,
                      borderRadius: 0.5,
                      fontWeight: 'bold'
                    }}
                  >
                    {result.highlighted_text}
                  </Box>
                )}
                {result.context_after && (
                  <span style={{ opacity: 0.7 }}>{result.context_after}...</span>
                )}
              </Typography>
              {result.page_number && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Page {result.page_number}
                </Typography>
              )}
            </Box>
          )}

          {/* Tags and Metadata */}
          {(result.tags?.length || result.author) && (
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              {result.author && (
                <Chip
                  icon={<PersonIcon sx={{ fontSize: 14 }} />}
                  label={result.author}
                  size="small"
                  variant="outlined"
                />
              )}
              
              {result.tags?.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  icon={<TagIcon sx={{ fontSize: 14 }} />}
                  label={tag}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              ))}
              
              {(result.tags?.length || 0) > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{(result.tags?.length || 0) - 3} more tags
                </Typography>
              )}
            </Stack>
          )}

          {/* Actions */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Added {format(new Date(result.created_at), 'MMM dd, yyyy')}
            </Typography>
            
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="View file">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResultClick(result);
                  }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Download">
                <IconButton size="small">
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Share">
                <IconButton size="small">
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <IconButton
                size="small"
                onClick={(e) => handleContextMenu(e, result)}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6">
            Search Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Searching...' : `${total} results found`}
            {searchTerm && ` for "${searchTerm}"`}
          </Typography>
        </Box>

        {results.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Per page</InputLabel>
              <Select
                value={pageSize}
                label="Per page"
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        )}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Results */}
      {results.length === 0 && !loading && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            textAlign: 'center'
          }}
        >
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No results found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms or filters
          </Typography>
        </Box>
      )}

      {results.length > 0 && (
        <>
          {/* Bulk Actions */}
          {selectedResults.size > 0 && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2">
                  {selectedResults.size} selected
                </Typography>
                <Button size="small" startIcon={<DownloadIcon />}>
                  Download
                </Button>
                <Button size="small" startIcon={<ShareIcon />}>
                  Share
                </Button>
                <Button size="small" startIcon={<CopyIcon />}>
                  Copy Links
                </Button>
              </Stack>
            </Box>
          )}

          {/* Results List */}
          <List sx={{ p: 0 }}>
            {results.map(renderResultCard)}
          </List>

          {/* Pagination */}
          {total > pageSize && (
            <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={Math.ceil(total / pageSize)}
                page={currentPage}
                onChange={(_, page) => onPageChange(page)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Stack>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleContextMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={handleContextMenuClose}>
          <ListItemIcon>
            <ViewIcon />
          </ListItemIcon>
          <ListItemText>Open File</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuClose}>
          <ListItemIcon>
            <DownloadIcon />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuClose}>
          <ListItemIcon>
            <ShareIcon />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleContextMenuClose}>
          <ListItemIcon>
            <StarIcon />
          </ListItemIcon>
          <ListItemText>Add to Favorites</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuClose}>
          <ListItemIcon>
            <TagIcon />
          </ListItemIcon>
          <ListItemText>Add Tags</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SearchResultsView;
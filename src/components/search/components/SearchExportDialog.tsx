import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Stack,
  Typography,
  Divider,
  Alert,
  LinearProgress,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TableChart as CsvIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Link as LinkIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { SearchResult } from '../../../services/advancedSearchService';
import { SearchFilters } from '../../../types';

interface SearchExportDialogProps {
  open: boolean;
  onClose: () => void;
  searchResults: SearchResult[];
  searchFilters?: SearchFilters;
  totalResults: number;
}

interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  includeContent: boolean;
  includeMetadata: boolean;
  includeFilters: boolean;
  includeStats: boolean;
  maxResults: number;
}

const SearchExportDialog: React.FC<SearchExportDialogProps> = ({
  open,
  onClose,
  searchResults,
  searchFilters,
  totalResults
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeContent: true,
    includeMetadata: true,
    includeFilters: true,
    includeStats: true,
    maxResults: Math.min(totalResults, 1000)
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportError(null);
      setExportSuccess(false);

      const exportData = await generateExportData();
      const blob = await createExportFile(exportData);
      downloadFile(blob);

      setExportSuccess(true);
      setExportProgress(100);
      
      // Auto-close after successful export
      setTimeout(() => {
        onClose();
        setExportSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportData = async () => {
    setExportProgress(25);

    // Prepare export data based on options
    const exportData: any = {
      exportedAt: new Date().toISOString(),
      totalResults,
      exportedResults: Math.min(searchResults.length, exportOptions.maxResults)
    };

    // Include search filters if requested
    if (exportOptions.includeFilters && searchFilters) {
      exportData.searchFilters = searchFilters;
    }

    setExportProgress(50);

    // Include statistics if requested
    if (exportOptions.includeStats) {
      exportData.statistics = generateStatistics();
    }

    setExportProgress(75);

    // Process results
    exportData.results = searchResults.slice(0, exportOptions.maxResults).map(result => {
      const exportResult: any = {
        fileName: result.file_name,
        fileType: result.file_type,
        exhibitId: result.exhibit_id,
        relevanceScore: result.relevance_score,
        createdAt: result.created_at,
        author: result.author,
        tags: result.tags
      };

      if (exportOptions.includeContent) {
        exportResult.matchText = result.match_text;
        exportResult.highlightedText = result.highlighted_text;
        exportResult.contextBefore = result.context_before;
        exportResult.contextAfter = result.context_after;
        exportResult.pageNumber = result.page_number;
      }

      if (exportOptions.includeMetadata) {
        exportResult.contentType = result.content_type;
        exportResult.evidenceStatus = result.evidence_status;
        exportResult.storagePath = result.storage_path;
      }

      return exportResult;
    });

    return exportData;
  };

  const generateStatistics = () => {
    const stats = {
      totalFiles: searchResults.length,
      fileTypes: {} as Record<string, number>,
      evidenceTypes: {} as Record<string, number>,
      averageRelevance: 0,
      tagsCount: {} as Record<string, number>
    };

    searchResults.forEach(result => {
      // File types
      stats.fileTypes[result.file_type] = (stats.fileTypes[result.file_type] || 0) + 1;

      // Evidence types
      if (result.evidence_status) {
        stats.evidenceTypes[result.evidence_status] = (stats.evidenceTypes[result.evidence_status] || 0) + 1;
      }

      // Tags
      result.tags?.forEach(tag => {
        stats.tagsCount[tag] = (stats.tagsCount[tag] || 0) + 1;
      });
    });

    // Average relevance
    stats.averageRelevance = searchResults.reduce((sum, result) => sum + result.relevance_score, 0) / searchResults.length;

    return stats;
  };

  const createExportFile = async (data: any): Promise<Blob> => {
    switch (exportOptions.format) {
      case 'csv':
        return createCSVFile(data);
      case 'pdf':
        return createPDFFile(data);
      case 'json':
        return createJSONFile(data);
      default:
        throw new Error('Unsupported export format');
    }
  };

  const createCSVFile = (data: any): Blob => {
    const rows: string[] = [];

    // Add header
    const headers = [
      'File Name',
      'File Type',
      'Exhibit ID',
      'Relevance Score',
      'Created At',
      'Author',
      'Tags'
    ];

    if (exportOptions.includeContent) {
      headers.push('Match Text', 'Page Number');
    }

    if (exportOptions.includeMetadata) {
      headers.push('Content Type', 'Evidence Status');
    }

    rows.push(headers.join(','));

    // Add data rows
    data.results.forEach((result: any) => {
      const row = [
        `"${result.fileName}"`,
        result.fileType,
        result.exhibitId || '',
        result.relevanceScore.toFixed(2),
        new Date(result.createdAt).toLocaleDateString(),
        `"${result.author || ''}"`,
        `"${result.tags?.join('; ') || ''}"`
      ];

      if (exportOptions.includeContent) {
        row.push(
          `"${(result.matchText || '').substring(0, 200)}..."`,
          result.pageNumber || ''
        );
      }

      if (exportOptions.includeMetadata) {
        row.push(result.contentType, result.evidenceStatus || '');
      }

      rows.push(row.join(','));
    });

    // Add summary if requested
    if (exportOptions.includeStats && data.statistics) {
      rows.push('');
      rows.push('STATISTICS');
      rows.push(`Total Files,${data.statistics.totalFiles}`);
      rows.push(`Average Relevance,${data.statistics.averageRelevance.toFixed(2)}`);
      
      // File types breakdown
      rows.push('');
      rows.push('File Types');
      Object.entries(data.statistics.fileTypes).forEach(([type, count]) => {
        rows.push(`${type},${count}`);
      });
    }

    return new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  };

  const createPDFFile = (data: any): Blob => {
    // For a production app, you would use a library like jsPDF or PDFKit
    // This is a simplified implementation that creates a text-based PDF-like content
    let content = `SEARCH RESULTS EXPORT\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Total Results: ${data.totalResults}\n`;
    content += `Exported Results: ${data.exportedResults}\n\n`;

    if (exportOptions.includeFilters && data.searchFilters) {
      content += `SEARCH FILTERS:\n`;
      if (data.searchFilters.searchTerm) {
        content += `Search Term: "${data.searchFilters.searchTerm}"\n`;
      }
      if (data.searchFilters.fileTypes?.length) {
        content += `File Types: ${data.searchFilters.fileTypes.join(', ')}\n`;
      }
      if (data.searchFilters.tags?.length) {
        content += `Tags: ${data.searchFilters.tags.join(', ')}\n`;
      }
      content += '\n';
    }

    content += `RESULTS:\n`;
    content += '=' + '='.repeat(50) + '\n\n';

    data.results.forEach((result: any, index: number) => {
      content += `${index + 1}. ${result.fileName}\n`;
      content += `   Type: ${result.fileType.toUpperCase()}`;
      if (result.exhibitId) content += ` | Exhibit: ${result.exhibitId}`;
      content += ` | Relevance: ${(result.relevanceScore * 100).toFixed(0)}%\n`;
      
      if (result.author) content += `   Author: ${result.author}\n`;
      if (result.tags?.length) content += `   Tags: ${result.tags.join(', ')}\n`;
      
      if (exportOptions.includeContent && result.matchText) {
        content += `   Preview: ${result.matchText.substring(0, 200)}...\n`;
      }
      
      content += `   Created: ${new Date(result.createdAt).toLocaleDateString()}\n\n`;
    });

    if (exportOptions.includeStats && data.statistics) {
      content += 'STATISTICS:\n';
      content += '=' + '='.repeat(50) + '\n';
      content += `Total Files: ${data.statistics.totalFiles}\n`;
      content += `Average Relevance: ${(data.statistics.averageRelevance * 100).toFixed(1)}%\n\n`;
      
      content += 'File Types:\n';
      Object.entries(data.statistics.fileTypes).forEach(([type, count]) => {
        content += `  ${type}: ${count}\n`;
      });
    }

    return new Blob([content], { type: 'application/pdf' });
  };

  const createJSONFile = (data: any): Blob => {
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  };

  const downloadFile = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `search-results-${timestamp}.${exportOptions.format}`;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <CsvIcon />;
      case 'pdf':
        return <PdfIcon />;
      case 'json':
        return <FileIcon />;
      default:
        return <FileIcon />;
    }
  };

  const getEstimatedFileSize = () => {
    const baseSize = searchResults.length * 0.5; // KB per result base
    let multiplier = 1;
    
    if (exportOptions.includeContent) multiplier += 2;
    if (exportOptions.includeMetadata) multiplier += 0.5;
    if (exportOptions.includeStats) multiplier += 0.1;
    
    const sizeKB = baseSize * multiplier;
    
    if (sizeKB < 1024) {
      return `~${Math.round(sizeKB)} KB`;
    } else {
      return `~${(sizeKB / 1024).toFixed(1)} MB`;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Export Search Results
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {exportError && (
            <Alert severity="error" onClose={() => setExportError(null)}>
              {exportError}
            </Alert>
          )}

          {exportSuccess && (
            <Alert severity="success" icon={<CheckIcon />}>
              Export completed successfully! The file has been downloaded.
            </Alert>
          )}

          {isExporting && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Exporting search results...
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={exportProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Export Format */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Export Format</FormLabel>
            <RadioGroup
              value={exportOptions.format}
              onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
            >
              <FormControlLabel
                value="csv"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CsvIcon fontSize="small" />
                    <span>CSV - Spreadsheet compatible</span>
                  </Stack>
                }
              />
              <FormControlLabel
                value="pdf"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PdfIcon fontSize="small" />
                    <span>PDF - Formatted document</span>
                  </Stack>
                }
              />
              <FormControlLabel
                value="json"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FileIcon fontSize="small" />
                    <span>JSON - Machine readable</span>
                  </Stack>
                }
              />
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Content Options */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Include in Export</FormLabel>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeContent}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeContent: e.target.checked }))}
                  />
                }
                label="Content previews and matches"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  />
                }
                label="File metadata and technical details"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeFilters}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeFilters: e.target.checked }))}
                  />
                }
                label="Search filters used"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeStats}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeStats: e.target.checked }))}
                  />
                }
                label="Statistics and summary"
              />
            </Stack>
          </FormControl>

          <Divider />

          {/* Export Summary */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Export Summary
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`${Math.min(searchResults.length, exportOptions.maxResults)} of ${totalResults} results`}
                  secondary="Number of search results to export"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {getFormatIcon(exportOptions.format)}
                </ListItemIcon>
                <ListItemText
                  primary={`${exportOptions.format.toUpperCase()} format`}
                  secondary={`Estimated file size: ${getEstimatedFileSize()}`}
                />
              </ListItem>
            </List>

            {/* File type breakdown */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                File types in export:
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {Object.entries(
                  searchResults.reduce((acc, result) => {
                    acc[result.file_type] = (acc[result.file_type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <Chip
                    key={type}
                    label={`${type}: ${count}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={isExporting || searchResults.length === 0}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SearchExportDialog;
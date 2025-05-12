import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Paper,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Download, 
  TableChart,
  FilterAlt,
  Search,
  ContentCopy,
  Visibility
} from '@mui/icons-material';
import Papa from 'papaparse';

interface SpreadsheetViewerProps {
  url: string;
  fileName: string;
}

const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({ url, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<number>(100);
  
  // Extract file extension
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Determine if we can parse the file
  const canParse = ['csv', 'tsv', 'txt'].includes(fileExtension);
  
  // Fetch and parse spreadsheet data
  useEffect(() => {
    const fetchSpreadsheet = async () => {
      setLoading(true);
      setError(null);
      
      if (!canParse) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch spreadsheet: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        
        // Parse CSV data
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            if (results.errors && results.errors.length > 0) {
              console.error('CSV parsing errors:', results.errors);
              setError('Error parsing spreadsheet. Some data may be incomplete or incorrect.');
            }
            
            if (results.data && results.data.length > 0) {
              setData(results.data);
              // Extract headers from the first row
              if (results.meta && results.meta.fields) {
                setHeaders(results.meta.fields);
              }
            } else {
              setError('No data found in spreadsheet or format not supported.');
            }
            
            setLoading(false);
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            setError('Failed to parse spreadsheet. The file might be corrupted or in an unsupported format.');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching spreadsheet:', error);
        setError('Failed to load spreadsheet. You can still download the file.');
        setLoading(false);
      }
    };
    
    fetchSpreadsheet();
  }, [url, canParse]);
  
  // Handle file download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render spreadsheet data as a table
  const renderTable = () => {
    if (!data || !headers.length) return null;
    
    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          height: '100%',
          overflow: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((header, index) => (
                <TableCell 
                  key={index}
                  sx={{ 
                    fontWeight: 'bold',
                    bgcolor: 'background.default',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, previewRows).map((row, rowIndex) => (
              <TableRow 
                key={rowIndex}
                sx={{ 
                  '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                {headers.map((header, cellIndex) => (
                  <TableCell 
                    key={cellIndex}
                    sx={{ 
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {String(row[header] || '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        height: '100%',
        p: 2
      }}
      data-test="spreadsheet-viewer"
    >
      {/* Loading state */}
      {loading && (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading spreadsheet...
          </Typography>
        </Box>
      )}
      
      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Spreadsheet content */}
      {!loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {fileName}
            </Typography>
            
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {data ? `${data.length} rows` : 'Spreadsheet'} • {fileExtension.toUpperCase()}
              </Typography>
              
              {/* Preview row count */}
              {data && data.length > 100 && (
                <Typography variant="caption">
                  Showing {Math.min(previewRows, data.length)} of {data.length} rows
                </Typography>
              )}
              
              {/* Actions */}
              <Stack direction="row" spacing={1}>
                <Tooltip title="Download file">
                  <IconButton onClick={handleDownload} size="small">
                    <Download fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                {canParse && (
                  <Tooltip title="Open in new tab">
                    <IconButton href={url} target="_blank" size="small">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Box>
          
          {/* Spreadsheet table or download prompt */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden', mb: 2 }}>
            {canParse && data ? (
              renderTable()
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  p: 5
                }}
              >
                <TableChart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Preview not available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  This spreadsheet type cannot be displayed in the browser.
                  <br />
                  Please download the file to view it.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownload}
                  size="large"
                >
                  Download Spreadsheet
                </Button>
              </Box>
            )}
          </Box>
          
          {/* Show more rows button */}
          {data && data.length > previewRows && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="outlined"
                onClick={() => setPreviewRows(prev => Math.min(prev + 100, data.length))}
              >
                Show more rows
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SpreadsheetViewer; 
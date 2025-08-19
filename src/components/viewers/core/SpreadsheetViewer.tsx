import React from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { GridOn as GridIcon } from '@mui/icons-material';

interface SpreadsheetViewerProps {
  url: string;
  fileName?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  url,
  fileName,
  onLoad,
  onError
}) => {
  // Mock spreadsheet grid
  const createMockGrid = () => {
    const rows = 10;
    const cols = 8;
    
    const cells = [];
    
    // Create header row with column letters
    const headerRow = [];
    headerRow.push(
      <Box 
        key="corner" 
        sx={{ 
          width: 40, 
          height: 24, 
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
        }}
      />
    );
    
    for (let col = 0; col < cols; col++) {
      const colLetter = String.fromCharCode(65 + col);
      headerRow.push(
        <Box 
          key={`header-${col}`} 
          sx={{ 
            width: 100, 
            height: 24, 
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}
        >
          {colLetter}
        </Box>
      );
    }
    
    cells.push(
      <Box key="header-row" sx={{ display: 'flex', flexDirection: 'row' }}>
        {headerRow}
      </Box>
    );
    
    // Create rows with data
    for (let row = 0; row < rows; row++) {
      const rowCells = [];
      
      // Row number
      rowCells.push(
        <Box 
          key={`row-${row}`} 
          sx={{ 
            width: 40, 
            height: 24, 
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}
        >
          {row + 1}
        </Box>
      );
      
      // Cell data
      for (let col = 0; col < cols; col++) {
        // Generate some mock data for certain cells
        let cellContent = '';
        
        if (row === 0 && col === 0) {
          cellContent = 'Name';
        } else if (row === 0 && col === 1) {
          cellContent = 'Date';
        } else if (row === 0 && col === 2) {
          cellContent = 'Amount';
        } else if (row === 1 && col === 0) {
          cellContent = 'Sample Entry';
        } else if (row === 1 && col === 1) {
          cellContent = '2025-05-16';
        } else if (row === 1 && col === 2) {
          cellContent = '$1,250.00';
        } else if (row === 2 && col === 0) {
          cellContent = 'Another Entry';
        } else if (row === 2 && col === 1) {
          cellContent = '2025-05-14';
        } else if (row === 2 && col === 2) {
          cellContent = '$750.00';
        }
        
        rowCells.push(
          <Box 
            key={`cell-${row}-${col}`} 
            sx={{ 
              width: 100, 
              height: 24, 
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: row === 0 ? 'action.hover' : 'background.paper',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: row === 0 ? 'bold' : 'normal',
            }}
          >
            {cellContent}
          </Box>
        );
      }
      
      cells.push(
        <Box key={`row-${row}-cells`} sx={{ display: 'flex', flexDirection: 'row' }}>
          {rowCells}
        </Box>
      );
    }
    
    return cells;
  };
  
  // Call onLoad handler
  React.useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);
  
  return (
    <Box 
      sx={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with file name */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <GridIcon sx={{ mr: 1 }} />
        <Typography variant="subtitle2">
          {fileName || 'Spreadsheet Viewer'}
        </Typography>
      </Paper>
      
      {/* Spreadsheet content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: 2,
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {createMockGrid()}
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Note: This is a demo viewer. In a real app, this would display the actual spreadsheet content.
        </Typography>
      </Box>
    </Box>
  );
};

export default SpreadsheetViewer;
import React from 'react';
import { Box, IconButton, Tooltip, Stack, useTheme, alpha, Typography } from '@mui/material';
import {
  ChevronRight,
  ChevronLeft,
  Folder,
  FileUpload,
  Search,
  InsertDriveFile,
  SmartToy,
} from '@mui/icons-material';

interface CollapsedPanelProps {
  side: 'left' | 'right';
  onExpand: () => void;
}

const CollapsedPanel: React.FC<CollapsedPanelProps> = ({ side, onExpand }) => {
  const theme = useTheme();

  const leftIcons = [
    { icon: <Folder fontSize="small" />, tooltip: 'Projects', key: 'files' },
    { icon: <FileUpload fontSize="small" />, tooltip: 'Upload', key: 'upload' },
    { icon: <Search fontSize="small" />, tooltip: 'Search', key: 'search' },
  ];

  const rightIcons = [
    { icon: <InsertDriveFile fontSize="small" />, tooltip: 'File Viewer', key: 'viewer' },
    { icon: <SmartToy fontSize="small" />, tooltip: 'AI Assistant', key: 'ai' },
  ];

  const icons = side === 'left' ? leftIcons : rightIcons;

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 1.5,
        pb: 2,
        bgcolor: 'background.paper',
        position: 'relative',
      }}
    >
      {/* Expand Button */}
      <Tooltip title={`Expand ${side} panel`} placement={side === 'left' ? 'right' : 'left'}>
        <IconButton
          onClick={onExpand}
          size="small"
          sx={{
            mb: 2,
            width: 30,
            height: 30,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: 'text.secondary',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.16),
              color: 'primary.main',
            },
            transition: 'all 150ms ease',
          }}
        >
          {side === 'left' ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </IconButton>
      </Tooltip>

      {/* Divider line */}
      <Box sx={{
        width: 20,
        height: 1,
        bgcolor: 'divider',
        mb: 2,
      }} />

      {/* Icon Stack — each icon expands the panel */}
      <Stack spacing={0.5} sx={{ width: '100%', alignItems: 'center' }}>
        {icons.map((item) => (
          <Tooltip
            key={item.key}
            title={item.tooltip}
            placement={side === 'left' ? 'right' : 'left'}
          >
            <IconButton
              size="small"
              onClick={onExpand}
              sx={{
                width: 32,
                height: 32,
                color: 'text.disabled',
                borderRadius: '8px',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
                transition: 'all 150ms ease',
              }}
            >
              {item.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Stack>

      {/* Rotated label at bottom */}
      <Box sx={{ mt: 'auto', mb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: side === 'left' ? 'rotate(180deg)' : 'none',
            color: 'text.disabled',
            fontSize: '0.65rem',
            letterSpacing: '0.05em',
            userSelect: 'none',
          }}
        >
          {side === 'left' ? 'Navigation' : 'Viewer & AI'}
        </Typography>
      </Box>
    </Box>
  );
};

export default CollapsedPanel;

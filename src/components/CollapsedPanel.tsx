import React from 'react';
import { Box, IconButton, Tooltip, Stack, useTheme, alpha } from '@mui/material';
import {
  ChevronRight,
  ChevronLeft,
  Folder,
  FileUpload,
  Search,
  ChatBubbleOutline,
  Memory,
  Analytics,
} from '@mui/icons-material';

interface CollapsedPanelProps {
  side: 'left' | 'right';
  onExpand: () => void;
}

const CollapsedPanel: React.FC<CollapsedPanelProps> = ({ side, onExpand }) => {
  const theme = useTheme();

  const leftIcons = [
    { icon: <Folder />, tooltip: 'Files', key: 'files' },
    { icon: <FileUpload />, tooltip: 'Upload', key: 'upload' },
    { icon: <Search />, tooltip: 'Search', key: 'search' },
  ];

  const rightIcons = [
    { icon: <ChatBubbleOutline />, tooltip: 'Chat', key: 'chat' },
    { icon: <Memory />, tooltip: 'Context', key: 'context' },
    { icon: <Analytics />, tooltip: 'Analytics', key: 'analytics' },
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
        py: 2,
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
            mb: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          {side === 'left' ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Tooltip>

      {/* Icon Stack */}
      <Stack spacing={1} sx={{ width: '100%', alignItems: 'center' }}>
        {icons.map((item) => (
          <Tooltip 
            key={item.key} 
            title={item.tooltip} 
            placement={side === 'left' ? 'right' : 'left'}
          >
            <IconButton
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              {item.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};

export default CollapsedPanel;
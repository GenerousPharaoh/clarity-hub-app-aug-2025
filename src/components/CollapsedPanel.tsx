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
      {/* Accent Line */}
      <Box sx={{
        width: 20,
        height: 2,
        background: 'linear-gradient(90deg, #1e293b, #334155)',
        borderRadius: 1,
        mx: 'auto',
        mb: 2,
      }} />

      {/* Expand Button */}
      <Tooltip title={`Expand ${side} panel`} placement={side === 'left' ? 'right' : 'left'}>
        <IconButton
          onClick={onExpand}
          size="small"
          sx={{
            mb: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              transform: 'scale(1.15)',
              boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
            },
            transition: 'all 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {side === 'left' ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Tooltip>

      {/* Icon Stack with dot separators */}
      <Stack
        spacing={1}
        divider={
          <Box sx={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            mx: 'auto',
          }} />
        }
        sx={{ width: '100%', alignItems: 'center' }}
      >
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
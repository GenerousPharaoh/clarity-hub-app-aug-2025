import React from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import { designTokens } from '../../theme/index';

interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | false;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  lines = 1,
  animation = 'wave'
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Professional skeleton styling for dark theme
  const skeletonSx = {
    backgroundColor: isDark ? designTokens.colors.dark[200] : designTokens.colors.neutral[200],
    '&::after': {
      background: isDark 
        ? `linear-gradient(90deg, transparent, ${designTokens.colors.dark[100]}, transparent)`
        : `linear-gradient(90deg, transparent, ${designTokens.colors.neutral[100]}, transparent)`,
    },
    borderRadius: variant === 'rectangular' ? designTokens.borderRadius.md : undefined,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={index === lines - 1 ? '75%' : '100%'}
            height={height || '1.2em'}
            animation={animation}
            sx={{
              ...skeletonSx,
              marginBottom: index === lines - 1 ? 0 : '0.5em',
            }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      sx={skeletonSx}
    />
  );
};

// Professional file list skeleton
export const FileListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <Box sx={{ padding: 2 }}>
    {Array.from({ length: items }).map((_, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: 1.5,
          marginBottom: 1,
          borderRadius: designTokens.borderRadius.md,
          backgroundColor: 'transparent',
        }}
      >
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <Box sx={{ marginLeft: 2, flex: 1 }}>
          <LoadingSkeleton variant="text" width="60%" height="1.2em" />
          <LoadingSkeleton variant="text" width="40%" height="0.9em" />
        </Box>
        <LoadingSkeleton variant="rectangular" width={60} height={24} />
      </Box>
    ))}
  </Box>
);

// Professional document viewer skeleton
export const DocumentViewerSkeleton: React.FC = () => (
  <Box sx={{ padding: 3, height: '100%' }}>
    <Box sx={{ marginBottom: 3 }}>
      <LoadingSkeleton variant="text" width="30%" height="2em" />
      <LoadingSkeleton variant="text" width="20%" height="1.2em" />
    </Box>
    <Box sx={{ height: 'calc(100% - 120px)' }}>
      <LoadingSkeleton variant="rectangular" width="100%" height="100%" />
    </Box>
  </Box>
);

// Professional panel skeleton
export const PanelSkeleton: React.FC<{ title?: string }> = ({ title }) => (
  <Box sx={{ padding: 2, height: '100%' }}>
    {title && (
      <Box sx={{ marginBottom: 3, borderBottom: `1px solid ${designTokens.colors.dark[300]}`, paddingBottom: 2 }}>
        <LoadingSkeleton variant="text" width="40%" height="1.5em" />
      </Box>
    )}
    <Box sx={{ flex: 1 }}>
      <LoadingSkeleton lines={8} />
    </Box>
  </Box>
);

export default LoadingSkeleton;
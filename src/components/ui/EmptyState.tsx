import React from 'react';
import { Box, Typography, Button, alpha, useTheme } from '@mui/material';
import { 
  FolderOpen as FolderOpenIcon,
  Description as DocumentIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Gavel as LegalIcon,
} from '@mui/icons-material';
import { designTokens } from '../../theme/index';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'contained' | 'outlined' | 'text';
  };
  illustration?: 'folder' | 'document' | 'search' | 'upload' | 'legal';
  size?: 'small' | 'medium' | 'large';
}

const illustrations = {
  folder: FolderOpenIcon,
  document: DocumentIcon,
  search: SearchIcon,
  upload: UploadIcon,
  legal: LegalIcon,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  illustration = 'folder',
  size = 'medium'
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const IconComponent = icon || illustrations[illustration];
  
  const sizeMap = {
    small: { iconSize: 48, spacing: 2, titleVariant: 'h6' as const, descVariant: 'body2' as const },
    medium: { iconSize: 64, spacing: 3, titleVariant: 'h5' as const, descVariant: 'body1' as const },
    large: { iconSize: 80, spacing: 4, titleVariant: 'h4' as const, descVariant: 'h6' as const },
  };
  
  const { iconSize, spacing, titleVariant, descVariant } = sizeMap[size];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: spacing * 2,
        height: '100%',
        minHeight: 200,
        color: isDark ? designTokens.colors.dark[600] : designTokens.colors.neutral[600],
      }}
    >
      {/* Icon — simple, no animation */}
      <Box
        sx={{
          width: iconSize,
          height: iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing,
        }}
      >
        {React.isValidElement(IconComponent) ? (
          IconComponent
        ) : (
          <IconComponent
            sx={{
              fontSize: iconSize * 0.5,
              color: isDark ? designTokens.colors.dark[400] : '#cdd0d5',
            }}
          />
        )}
      </Box>

      {/* Title — solid color, no gradient */}
      <Typography
        variant={titleVariant}
        sx={{
          fontWeight: 600,
          fontSize: '1rem',
          color: isDark ? designTokens.colors.dark[800] : designTokens.colors.neutral[800],
          marginBottom: description ? 1 : spacing,
          maxWidth: 360,
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          variant={descVariant}
          sx={{
            color: isDark ? designTokens.colors.dark[600] : designTokens.colors.neutral[600],
            marginBottom: spacing,
            maxWidth: 360,
            fontSize: '0.844rem',
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      )}

      {/* Action button */}
      {action && (
        <Button
          variant={action.variant || 'contained'}
          onClick={action.onClick}
          sx={{
            textTransform: 'none',
            transition: 'all 120ms ease',
          }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
};

// Pre-configured empty states for common scenarios
export const NoFilesEmptyState: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
  <EmptyState
    illustration="folder"
    title="No files yet"
    description="Upload documents, evidence, and case files to get started with your legal case management."
    action={onUpload ? {
      label: "Upload Files",
      onClick: onUpload,
      variant: "contained"
    } : undefined}
  />
);

export const NoSearchResultsEmptyState: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
  <EmptyState
    illustration="search"
    title="No results found"
    description="Try adjusting your search terms or filters to find what you're looking for."
    action={onClear ? {
      label: "Clear Search",
      onClick: onClear,
      variant: "outlined"
    } : undefined}
    size="small"
  />
);

export const NoDocumentsEmptyState: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => (
  <EmptyState
    illustration="document"
    title="No documents"
    description="Create your first legal document or import existing files to begin building your case."
    action={onCreate ? {
      label: "Create Document",
      onClick: onCreate,
      variant: "contained"
    } : undefined}
  />
);

export const LoadingEmptyState: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <EmptyState
    illustration="legal"
    title={message}
    description="Please wait while we prepare your legal workspace."
    size="small"
  />
);

export default EmptyState;
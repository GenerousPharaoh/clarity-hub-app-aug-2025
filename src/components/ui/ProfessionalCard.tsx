import React from 'react';
import { Card, CardProps, CardContent, CardHeader, CardActions, alpha, styled } from '@mui/material';
import { designTokens, professionalAnimations } from '../../theme/index';

interface ProfessionalCardProps extends CardProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  interactive?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
}

// Professional styled card with micro-interactions
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => !['variant', 'interactive', 'padding', 'hover'].includes(prop as string),
})<ProfessionalCardProps>(({ theme, variant = 'elevated', interactive = false, hover = true }) => ({
  // Base styles
  borderRadius: designTokens.borderRadius.lg,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  position: 'relative',
  overflow: 'hidden',
  
  // Professional transitions
  transition: professionalAnimations.createTransition([
    'transform',
    'box-shadow',
    'border-color',
    'background-color'
  ]),
  
  // Variant-specific styles
  ...(variant === 'elevated' && {
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.palette.mode === 'dark' 
      ? designTokens.shadows.dark.sm
      : designTokens.shadows.panel,
    
    ...(hover && {
      '&:hover': {
        transform: interactive ? 'translateY(-2px)' : 'translateY(-1px)',
        boxShadow: theme.palette.mode === 'dark'
          ? designTokens.shadows.dark.md
          : designTokens.shadows.md,
      },
    }),
  }),
  
  ...(variant === 'outlined' && {
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
    backgroundColor: theme.palette.background.paper,
    
    ...(hover && {
      '&:hover': {
        transform: interactive ? 'translateY(-2px)' : 'none',
        borderColor: alpha(theme.palette.primary.main, 0.3),
        backgroundColor: alpha(theme.palette.primary.main, 0.02),
      },
    }),
  }),
  
  ...(variant === 'filled' && {
    border: 'none',
    boxShadow: 'none',
    backgroundColor: theme.palette.mode === 'dark' 
      ? designTokens.colors.dark[100]
      : designTokens.colors.neutral[50],
    
    ...(hover && {
      '&:hover': {
        transform: interactive ? 'translateY(-2px)' : 'none',
        backgroundColor: theme.palette.mode === 'dark'
          ? designTokens.colors.dark[200]
          : designTokens.colors.neutral[100],
      },
    }),
  }),
  
  // Interactive states
  ...(interactive && {
    cursor: 'pointer',
    
    '&:active': {
      transform: 'translateY(0)',
    },
    
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  }),
  
  // Loading state
  '&[data-loading="true"]': {
    pointerEvents: 'none',
    opacity: 0.7,
    
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.5) 50%, transparent 75%)',
      backgroundSize: '200px 100%',
      animation: `${professionalAnimations.keyframes.shimmer} 1.5s infinite linear`,
      zIndex: 1,
    },
  },
}));

// Professional card content with proper spacing
const StyledCardContent = styled(CardContent, {
  shouldForwardProp: (prop) => prop !== 'padding',
})<{ padding: 'none' | 'small' | 'medium' | 'large' }>(({ padding = 'medium' }) => ({
  '&.MuiCardContent-root': {
    ...(padding === 'none' && { padding: 0 }),
    ...(padding === 'small' && { padding: designTokens.spacing[4] }),
    ...(padding === 'medium' && { padding: designTokens.spacing[6] }),
    ...(padding === 'large' && { padding: designTokens.spacing[8] }),
    
    '&:last-child': {
      ...(padding === 'none' && { paddingBottom: 0 }),
      ...(padding === 'small' && { paddingBottom: designTokens.spacing[4] }),
      ...(padding === 'medium' && { paddingBottom: designTokens.spacing[6] }),
      ...(padding === 'large' && { paddingBottom: designTokens.spacing[8] }),
    },
  },
}));

// Professional card header with consistent styling
const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  '&.MuiCardHeader-root': {
    paddingBottom: designTokens.spacing[2],
    
    '& .MuiCardHeader-title': {
      fontSize: designTokens.typography.fontSize.lg,
      fontWeight: designTokens.typography.fontWeight.semibold,
      color: theme.palette.text.primary,
      lineHeight: designTokens.typography.lineHeight.snug,
    },
    
    '& .MuiCardHeader-subheader': {
      fontSize: designTokens.typography.fontSize.sm,
      color: theme.palette.text.secondary,
      marginTop: designTokens.spacing[1],
      lineHeight: designTokens.typography.lineHeight.normal,
    },
  },
}));

// Professional card actions with proper spacing
const StyledCardActions = styled(CardActions)(() => ({
  '&.MuiCardActions-root': {
    padding: `${designTokens.spacing[2]} ${designTokens.spacing[6]}`,
    paddingTop: 0,
    gap: designTokens.spacing[2],
    
    '& .MuiButton-root': {
      minWidth: 'auto',
    },
  },
}));

// Overlay component for loading states
const LoadingOverlay = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2,
  borderRadius: 'inherit',
}));

export const ProfessionalCard: React.FC<ProfessionalCardProps & {
  header?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}> = ({
  children,
  header,
  actions,
  variant = 'elevated',
  interactive = false,
  padding = 'medium',
  hover = true,
  loading = false,
  onClick,
  ...props
}) => {
  const handleClick = () => {
    if (loading) return;
    onClick?.();
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (loading) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <StyledCard
      variant={variant}
      interactive={interactive || !!onClick}
      padding={padding}
      hover={hover}
      onClick={interactive || onClick ? handleClick : undefined}
      onKeyDown={interactive || onClick ? handleKeyDown : undefined}
      tabIndex={interactive || onClick ? 0 : undefined}
      role={interactive || onClick ? 'button' : undefined}
      data-loading={loading}
      {...props}
    >
      {header && (
        <StyledCardHeader
          title={typeof header === 'string' ? header : undefined}
          {...(typeof header === 'object' && header)}
        />
      )}
      
      <StyledCardContent padding={padding}>
        {children}
      </StyledCardContent>
      
      {actions && (
        <StyledCardActions>
          {actions}
        </StyledCardActions>
      )}
      
      {loading && (
        <LoadingOverlay>
          {/* Loading content can be added here */}
        </LoadingOverlay>
      )}
    </StyledCard>
  );
};

// Export individual components for advanced usage
export const ProfessionalCardContent = StyledCardContent;
export const ProfessionalCardHeader = StyledCardHeader;
export const ProfessionalCardActions = StyledCardActions;

export default ProfessionalCard;
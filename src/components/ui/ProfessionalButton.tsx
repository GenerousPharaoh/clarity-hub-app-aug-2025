import React from 'react';
import { Button, ButtonProps, CircularProgress, alpha, styled } from '@mui/material';
import { designTokens, professionalAnimations } from '../../theme/index';

interface ProfessionalButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'contained' | 'outlined' | 'text' | 'soft';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  rounded?: boolean;
}

// Professional styled button with micro-interactions
const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => !['rounded', 'loading'].includes(prop as string),
})<ProfessionalButtonProps>(({ theme, variant, rounded, loading }) => ({
  // Base styles
  fontFamily: designTokens.typography.fontFamily.primary,
  fontWeight: designTokens.typography.fontWeight.medium,
  fontSize: designTokens.typography.fontSize.sm,
  lineHeight: designTokens.typography.lineHeight.normal,
  borderRadius: rounded ? designTokens.borderRadius.full : designTokens.borderRadius.md,
  textTransform: 'none',
  letterSpacing: designTokens.typography.letterSpacing.wide,
  position: 'relative',
  overflow: 'hidden',
  
  // Professional transitions
  transition: professionalAnimations.createTransition([
    'all',
    'transform',
    'box-shadow',
    'background-color',
    'border-color',
    'color'
  ]),
  
  // Micro-interactions
  ...professionalAnimations.microInteractions.buttonPress,
  
  // Hover lift effect
  '&:hover:not(:disabled)': {
    transform: 'translateY(-1px)',
  },
  
  '&:active:not(:disabled)': {
    transform: 'translateY(0)',
  },
  
  // Disabled state
  '&:disabled': {
    transform: 'none',
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  
  // Loading state
  ...(loading && {
    color: 'transparent !important',
    pointerEvents: 'none',
  }),
  
  // Variant-specific styles
  ...(variant === 'contained' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: 'none',
    boxShadow: theme.palette.mode === 'dark' 
      ? designTokens.shadows.dark.xs
      : designTokens.shadows.xs,
    
    '&:hover:not(:disabled)': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: theme.palette.mode === 'dark'
        ? designTokens.shadows.dark.sm
        : designTokens.shadows.sm,
      transform: 'translateY(-1px)',
    },
    
    '&:active:not(:disabled)': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: theme.palette.mode === 'dark'
        ? designTokens.shadows.dark.xs
        : designTokens.shadows.xs,
      transform: 'translateY(0)',
    },
  }),
  
  ...(variant === 'outlined' && {
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
    
    '&:hover:not(:disabled)': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      borderColor: theme.palette.primary.main,
      transform: 'translateY(-1px)',
    },
    
    '&:active:not(:disabled)': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      transform: 'translateY(0)',
    },
  }),
  
  ...(variant === 'text' && {
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    border: 'none',
    
    '&:hover:not(:disabled)': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      transform: 'translateY(-1px)',
    },
    
    '&:active:not(:disabled)': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      transform: 'translateY(0)',
    },
  }),
  
  ...(variant === 'soft' && {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,
    border: 'none',
    
    '&:hover:not(:disabled)': {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      transform: 'translateY(-1px)',
    },
    
    '&:active:not(:disabled)': {
      backgroundColor: alpha(theme.palette.primary.main, 0.16),
      transform: 'translateY(0)',
    },
  }),
}));

// Loading spinner overlay
const LoadingSpinner = styled('div')<{ size: 'small' | 'medium' | 'large' }>(({ theme, size }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  
  '& .MuiCircularProgress-root': {
    color: 'currentColor',
    ...(size === 'small' && { width: '16px !important', height: '16px !important' }),
    ...(size === 'medium' && { width: '20px !important', height: '20px !important' }),
    ...(size === 'large' && { width: '24px !important', height: '24px !important' }),
  },
}));

// Button content wrapper
const ButtonContent = styled('span')<{ hasIcon: boolean; iconPosition: 'left' | 'right' }>(({ hasIcon, iconPosition }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: hasIcon ? designTokens.spacing[2] : 0,
  flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row',
}));

// Icon wrapper
const IconWrapper = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'inherit',
  
  '& svg': {
    fontSize: '1.2em',
    width: '1.2em',
    height: '1.2em',
  },
});

export const ProfessionalButton: React.FC<ProfessionalButtonProps> = ({
  children,
  variant = 'contained',
  size = 'medium',
  loading = false,
  icon,
  rounded = false,
  disabled,
  onClick,
  ...props
}) => {
  const [iconPosition] = React.useState<'left' | 'right'>('left');
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <StyledButton
      variant={variant === 'soft' ? 'text' : variant}
      size={size}
      disabled={disabled || loading}
      onClick={handleClick}
      rounded={rounded}
      loading={loading}
      {...props}
    >
      <ButtonContent hasIcon={!!icon} iconPosition={iconPosition}>
        {icon && (
          <IconWrapper>
            {icon}
          </IconWrapper>
        )}
        {children}
      </ButtonContent>
      
      {loading && (
        <LoadingSpinner size={size}>
          <CircularProgress size="inherit" thickness={4} />
        </LoadingSpinner>
      )}
    </StyledButton>
  );
};

export default ProfessionalButton;
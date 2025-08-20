import React from 'react';
import { 
  TextField, 
  TextFieldProps, 
  InputAdornment, 
  IconButton,
  alpha,
  styled,
  FormHelperText
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { designTokens, professionalAnimations } from '../../theme/index';

interface ProfessionalTextFieldProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
  clearable?: boolean;
  passwordToggle?: boolean;
}

// Professional styled text field with micro-interactions
const StyledTextField = styled(TextField)<ProfessionalTextFieldProps>(({ theme, variant = 'outlined' }) => ({
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium,
    fontFamily: designTokens.typography.fontFamily.primary,
    transform: 'translate(14px, 16px) scale(1)',
    
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
    
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
      backgroundColor: theme.palette.background.paper,
      padding: '0 8px',
    },
  },
  
  // Outlined variant styles
  ...(variant === 'outlined' && {
    '& .MuiOutlinedInput-root': {
      borderRadius: designTokens.borderRadius.md,
      backgroundColor: theme.palette.background.paper,
      fontFamily: designTokens.typography.fontFamily.primary,
      fontSize: designTokens.typography.fontSize.base,
      lineHeight: designTokens.typography.lineHeight.normal,
      transition: professionalAnimations.createTransition([
        'border-color',
        'box-shadow',
        'background-color'
      ]),
      
      '& fieldset': {
        borderColor: theme.palette.divider,
        borderWidth: 1,
        transition: professionalAnimations.createTransition(['border-color']),
      },
      
      '&:hover:not(.Mui-disabled) fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.3),
      },
      
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
      },
      
      '&.Mui-error fieldset': {
        borderColor: theme.palette.error.main,
        
        '&.Mui-focused': {
          boxShadow: `0 0 0 3px ${alpha(theme.palette.error.main, 0.08)}`,
        },
      },
      
      '&.Mui-disabled': {
        backgroundColor: theme.palette.mode === 'dark' 
          ? designTokens.colors.dark[100]
          : designTokens.colors.neutral[50],
        
        '& fieldset': {
          borderColor: theme.palette.action.disabledBackground,
        },
      },
    },
    
    '& .MuiOutlinedInput-input': {
      padding: '12px 14px',
      color: theme.palette.text.primary,
      
      '&::placeholder': {
        color: theme.palette.text.disabled,
        opacity: 1,
        fontSize: designTokens.typography.fontSize.sm,
      },
      
      '&:autofill': {
        borderRadius: 'inherit',
      },
    },
    
    '& .MuiOutlinedInput-inputSizeSmall': {
      padding: '8px 12px',
      fontSize: designTokens.typography.fontSize.sm,
    },
    
    '& .MuiOutlinedInput-inputMultiline': {
      padding: 0,
    },
  }),
  
  // Filled variant styles
  ...(variant === 'filled' && {
    '& .MuiFilledInput-root': {
      backgroundColor: theme.palette.mode === 'dark'
        ? designTokens.colors.dark[100]
        : designTokens.colors.neutral[50],
      borderRadius: `${designTokens.borderRadius.md} ${designTokens.borderRadius.md} 0 0`,
      border: 'none',
      transition: professionalAnimations.createTransition(['background-color', 'box-shadow']),
      
      '&:hover:not(.Mui-disabled)': {
        backgroundColor: theme.palette.mode === 'dark'
          ? designTokens.colors.dark[200]
          : designTokens.colors.neutral[100],
      },
      
      '&.Mui-focused': {
        backgroundColor: theme.palette.mode === 'dark'
          ? designTokens.colors.dark[200]
          : designTokens.colors.neutral[100],
        boxShadow: `inset 0 -2px 0 ${theme.palette.primary.main}`,
      },
      
      '&.Mui-error.Mui-focused': {
        boxShadow: `inset 0 -2px 0 ${theme.palette.error.main}`,
      },
      
      '&:before, &:after': {
        display: 'none',
      },
    },
    
    '& .MuiFilledInput-input': {
      padding: '12px 14px 8px',
      color: theme.palette.text.primary,
      
      '&::placeholder': {
        color: theme.palette.text.disabled,
        opacity: 1,
      },
    },
  }),
  
  // Standard variant styles
  ...(variant === 'standard' && {
    '& .MuiInput-root': {
      '&:before': {
        borderBottomColor: theme.palette.divider,
        transition: professionalAnimations.createTransition(['border-color']),
      },
      
      '&:hover:not(.Mui-disabled):before': {
        borderBottomColor: alpha(theme.palette.primary.main, 0.3),
      },
      
      '&.Mui-focused:after': {
        borderBottomColor: theme.palette.primary.main,
        borderBottomWidth: 2,
      },
      
      '&.Mui-error:after': {
        borderBottomColor: theme.palette.error.main,
      },
    },
    
    '& .MuiInput-input': {
      padding: '8px 0',
      color: theme.palette.text.primary,
      
      '&::placeholder': {
        color: theme.palette.text.disabled,
        opacity: 1,
      },
    },
  }),
  
  // Helper text styles
  '& .MuiFormHelperText-root': {
    marginTop: designTokens.spacing[2],
    marginLeft: 0,
    fontSize: designTokens.typography.fontSize.xs,
    lineHeight: designTokens.typography.lineHeight.normal,
    color: theme.palette.text.secondary,
    
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
}));

// Professional input adornment styles
const StyledInputAdornment = styled(InputAdornment)(({ theme }) => ({
  '& .MuiIconButton-root': {
    color: theme.palette.text.secondary,
    padding: 6,
    transition: professionalAnimations.createTransition(['color']),
    
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
    },
    
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  },
  
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
  },
}));

export const ProfessionalTextField: React.FC<ProfessionalTextFieldProps> = ({
  variant = 'outlined',
  clearable = false,
  passwordToggle = false,
  type,
  value,
  onChange,
  InputProps,
  helperText,
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value || '');
  
  // Determine if this is a password field
  const isPassword = type === 'password' || passwordToggle;
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  
  React.useEffect(() => {
    setLocalValue(value || '');
  }, [value]);
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(event.target.value);
    onChange?.(event);
  };
  
  const handleClear = () => {
    const event = {
      target: { value: '' }
    } as React.ChangeEvent<HTMLInputElement>;
    setLocalValue('');
    onChange?.(event);
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Build input adornments
  const endAdornments = [];
  
  // Add clear button
  if (clearable && localValue && !props.disabled) {
    endAdornments.push(
      <StyledInputAdornment key="clear" position="end">
        <IconButton
          onClick={handleClear}
          size="small"
          aria-label="Clear input"
          tabIndex={-1}
        >
          ×
        </IconButton>
      </StyledInputAdornment>
    );
  }
  
  // Add password visibility toggle
  if (isPassword) {
    endAdornments.push(
      <StyledInputAdornment key="password-toggle" position="end">
        <IconButton
          onClick={togglePasswordVisibility}
          size="small"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </StyledInputAdornment>
    );
  }
  
  const enhancedInputProps = {
    ...InputProps,
    endAdornment: (
      <>
        {InputProps?.endAdornment}
        {endAdornments}
      </>
    ),
  };

  return (
    <StyledTextField
      variant={variant}
      type={inputType}
      value={localValue}
      onChange={handleChange}
      InputProps={enhancedInputProps}
      helperText={helperText}
      error={error}
      {...props}
    />
  );
};

// Export helper components
export const ProfessionalFormHelperText = styled(FormHelperText)(({ theme }) => ({
  marginTop: designTokens.spacing[2],
  marginLeft: 0,
  fontSize: designTokens.typography.fontSize.xs,
  lineHeight: designTokens.typography.lineHeight.normal,
  color: theme.palette.text.secondary,
  
  '&.Mui-error': {
    color: theme.palette.error.main,
  },
}));

export default ProfessionalTextField;
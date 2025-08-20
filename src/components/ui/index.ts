// Professional UI Components for Legal Case Management
// Google Docs-inspired design system components

// Core Components
export { default as ProfessionalButton } from './ProfessionalButton';
export { 
  default as ProfessionalCard,
  ProfessionalCardContent,
  ProfessionalCardHeader,
  ProfessionalCardActions
} from './ProfessionalCard';
export { 
  default as ProfessionalTextField,
  ProfessionalFormHelperText
} from './ProfessionalTextField';

// Layout Components
export { default as ProfessionalLayout } from './ProfessionalLayout';

// Showcase Components
export { default as ComponentShowcase } from './ComponentShowcase';

// TypeScript interfaces for better development experience
export interface ProfessionalButtonProps {
  variant?: 'contained' | 'outlined' | 'text' | 'soft';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  rounded?: boolean;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export interface ProfessionalCardProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  interactive?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
  header?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export interface ProfessionalTextFieldProps {
  variant?: 'outlined' | 'filled' | 'standard';
  clearable?: boolean;
  passwordToggle?: boolean;
  type?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  rows?: number;
}

export interface ProfessionalLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  sidebarWidth?: number;
  headerHeight?: number;
}

// Simplified design tokens to prevent runtime errors
const fallbackDesignTokens = {
  colors: {
    primary: { 500: '#2563eb' },
    neutral: { 600: '#666666' },
    success: { 500: '#10b981' },
    warning: { 500: '#f59e0b' },
    error: { 500: '#ef4444' },
  },
  spacing: {
    4: '1rem',
    6: '1.5rem',
    10: '2.5rem',
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.1)',
    base: '0 4px 20px rgba(0,0,0,0.08)',
    md: '0 8px 32px rgba(0,0,0,0.1)',
    lg: '0 16px 48px rgba(0,0,0,0.15)',
    panel: '0 4px 20px rgba(0,0,0,0.08)',
    interactive: '0 8px 32px rgba(37,99,235,0.15)',
  },
  borderRadius: {
    base: '0.375rem',
  },
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  },
};

// Common patterns and helpers
export const CommonPatterns = {
  // Professional shadows
  elevatedCard: fallbackDesignTokens.shadows.panel,
  interactiveCard: fallbackDesignTokens.shadows.interactive,
  
  // Professional spacing
  sectionSpacing: fallbackDesignTokens.spacing[10],
  componentSpacing: fallbackDesignTokens.spacing[6],
  elementSpacing: fallbackDesignTokens.spacing[4],
  
  // Professional typography
  headingFont: fallbackDesignTokens.typography.fontFamily.primary,
  bodyFont: fallbackDesignTokens.typography.fontFamily.primary,
  
  // Professional colors
  primaryAction: fallbackDesignTokens.colors.primary[500],
  secondaryAction: fallbackDesignTokens.colors.neutral[600],
  successAction: fallbackDesignTokens.colors.success[500],
  warningAction: fallbackDesignTokens.colors.warning[500],
  errorAction: fallbackDesignTokens.colors.error[500],
};

// Component style helpers
export const ComponentHelpers = {
  // Create hover effect for interactive elements
  createHoverEffect: (color: string) => ({
    transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: `${color}04`,
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  }),
  
  // Create focus ring for accessibility
  createFocusRing: (color: string = fallbackDesignTokens.colors.primary[500]) => ({
    '&:focus-visible': {
      outline: `2px solid ${color}`,
      outlineOffset: 2,
      borderRadius: fallbackDesignTokens.borderRadius.base,
    },
  }),
  
  // Create professional border
  createBorder: (opacity: number = 0.08) => ({
    border: `1px solid rgba(0, 0, 0, ${opacity})`,
  }),
  
  // Create professional shadow
  createShadow: (level: 'sm' | 'base' | 'md' | 'lg' = 'base') => ({
    boxShadow: fallbackDesignTokens.shadows[level],
  }),
};
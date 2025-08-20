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

// Re-export design tokens and animations for convenience
export { designTokens, professionalAnimations } from '../../theme/index';

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

// Design System Utilities
export const DesignTokens = designTokens;
export const Animations = professionalAnimations;

// Common patterns and helpers
export const CommonPatterns = {
  // Professional shadows
  elevatedCard: designTokens.shadows.panel,
  interactiveCard: designTokens.shadows.interactive,
  
  // Professional spacing
  sectionSpacing: designTokens.spacing[10],
  componentSpacing: designTokens.spacing[6],
  elementSpacing: designTokens.spacing[4],
  
  // Professional typography
  headingFont: designTokens.typography.fontFamily.primary,
  bodyFont: designTokens.typography.fontFamily.primary,
  
  // Professional colors
  primaryAction: designTokens.colors.primary[500],
  secondaryAction: designTokens.colors.neutral[600],
  successAction: designTokens.colors.success[500],
  warningAction: designTokens.colors.warning[500],
  errorAction: designTokens.colors.error[500],
};

// Component style helpers
export const ComponentHelpers = {
  // Create hover effect for interactive elements
  createHoverEffect: (color: string) => ({
    transition: professionalAnimations.createTransition(['background-color', 'transform']),
    '&:hover': {
      backgroundColor: `${color}04`,
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  }),
  
  // Create focus ring for accessibility
  createFocusRing: (color: string = designTokens.colors.primary[500]) => ({
    '&:focus-visible': {
      outline: `2px solid ${color}`,
      outlineOffset: 2,
      borderRadius: designTokens.borderRadius.base,
    },
  }),
  
  // Create professional border
  createBorder: (opacity: number = 0.08) => ({
    border: `1px solid rgba(0, 0, 0, ${opacity})`,
  }),
  
  // Create professional shadow
  createShadow: (level: 'sm' | 'base' | 'md' | 'lg' = 'base') => ({
    boxShadow: designTokens.shadows[level],
  }),
};
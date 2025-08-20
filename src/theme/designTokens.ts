/**
 * Design Tokens for Legal Case Management App
 * Professional "Google Docs for litigation" aesthetic
 */

// Color Palette - Google Docs inspired professional colors
export const colors = {
  // Neutral base colors
  neutral: {
    50: '#f8f9fa',    // Background
    100: '#f1f3f4',   // Light background
    200: '#e8eaed',   // Border light
    300: '#dadce0',   // Border
    400: '#bdc1c6',   // Border dark
    500: '#9aa0a6',   // Text disabled
    600: '#80868b',   // Text secondary
    700: '#5f6368',   // Text secondary dark
    800: '#3c4043',   // Text primary
    900: '#202124',   // Text primary dark
  },
  
  // Primary blue - Professional interaction color
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563eb',    // Main primary
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#1e3a8a',
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#10b981',    // Main success
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  warning: {
    50: '#fefbf2',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',    // Main warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',    // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Dark mode colors
  dark: {
    50: '#18181b',     // Background
    100: '#27272a',    // Panel background
    200: '#3f3f46',    // Border
    300: '#52525b',    // Border hover
    400: '#71717a',    // Text disabled
    500: '#a1a1aa',    // Text secondary
    600: '#d4d4d8',    // Text primary
    700: '#e4e4e7',    // Text emphasis
    800: '#f4f4f5',    // Text high contrast
    900: '#fafafa',    // Text maximum contrast
  },
} as const;

// Typography Scale - Legal document focused
export const typography = {
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    monospace: '"Fira Code", "SF Mono", Monaco, Consolas, monospace',
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Spacing Scale - 8px base grid
export const spacing = {
  0: '0px',
  1: '0.25rem',      // 4px
  2: '0.5rem',       // 8px
  3: '0.75rem',      // 12px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  8: '2rem',         // 32px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  32: '8rem',        // 128px
} as const;

// Border Radius - Subtle, professional corners
export const borderRadius = {
  none: '0px',
  sm: '0.25rem',     // 4px
  base: '0.375rem',  // 6px
  md: '0.5rem',      // 8px
  lg: '0.75rem',     // 12px
  xl: '1rem',        // 16px
  '2xl': '1.5rem',   // 24px
  full: '9999px',
} as const;

// Shadow System - Subtle, professional depth
export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Professional interactive shadows
  interactive: '0 8px 32px rgba(37, 99, 235, 0.15)',
  panel: '0 4px 20px rgba(0, 0, 0, 0.08)',
  
  // Dark mode shadows
  dark: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
} as const;

// Animation System - Professional micro-interactions
export const animations = {
  duration: {
    instant: '100ms',
    fast: '120ms',
    normal: '160ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Professional easing curves
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Common transitions
  transition: {
    fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '160ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Specific property transitions
    colors: 'color 120ms cubic-bezier(0.4, 0, 0.2, 1), background-color 120ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 160ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 160ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Z-Index Scale - Layering system
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Breakpoints - Responsive design
export const breakpoints = {
  xs: '0px',
  sm: '600px',
  md: '900px',
  lg: '1200px',
  xl: '1536px',
} as const;

// Professional component variants
export const components = {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
    },
    padding: {
      sm: '0.5rem 1rem',
      md: '0.75rem 1.5rem',
      lg: '1rem 2rem',
    },
  },
  
  input: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
    },
    padding: '0 0.75rem',
  },
  
  card: {
    padding: {
      sm: '1rem',      // 16px
      md: '1.5rem',    // 24px
      lg: '2rem',      // 32px
    },
  },
} as const;

// Professional legal document theming
export const legal = {
  // Document colors
  document: {
    background: '#ffffff',
    paper: '#fefefe',
    margin: colors.neutral[100],
    text: colors.neutral[800],
    heading: colors.neutral[900],
  },
  
  // Status colors for legal cases
  status: {
    draft: colors.neutral[500],
    active: colors.primary[500],
    onHold: colors.warning[500],
    completed: colors.success[500],
    archived: colors.neutral[400],
    urgent: colors.error[500],
  },
  
  // Priority colors
  priority: {
    low: colors.success[400],
    medium: colors.warning[400],
    high: colors.error[400],
    critical: colors.error[600],
  },
} as const;

// Export all tokens as a cohesive design system
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  zIndex,
  breakpoints,
  components,
  legal,
} as const;

export default designTokens;
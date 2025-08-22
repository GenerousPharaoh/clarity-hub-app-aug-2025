/**
 * Design Tokens for Legal Case Management App
 * Professional "Google Docs for litigation" aesthetic
 */

// Color Palette - Sophisticated legal software colors inspired by "Notion meets LexisNexis"
export const colors = {
  // Light mode neutral colors
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
  
  // Professional navy blue primary - Legal confidence and trust
  primary: {
    50: '#eff6ff',    // Lightest navy
    100: '#dbeafe',   // Very light navy
    200: '#bfdbfe',   // Light navy
    300: '#93c5fd',   // Medium light navy
    400: '#60a5fa',   // Medium navy
    500: '#1e3a8a',   // Main navy primary - sophisticated professional
    600: '#1e40af',   // Dark navy
    700: '#1d4ed8',   // Darker navy
    800: '#1e3a8a',   // Very dark navy
    900: '#1e3a8a',   // Darkest navy
  },
  
  // Indigo secondary - Professional accent
  secondary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',   // Main indigo secondary
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Semantic colors - Enhanced for legal software
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',    // Clean green for success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',    // Sophisticated amber for warnings
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
    500: '#ef4444',    // Professional red for errors
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Sophisticated dark mode colors - Deep midnight blue foundation
  dark: {
    50: '#0a0f1b',     // Deep midnight blue background
    100: '#111827',    // Dark slate surface
    200: '#1f2937',    // Elevated surface
    300: '#374151',    // Border subtle
    400: '#4b5563',    // Border
    500: '#6b7280',    // Text disabled
    600: '#9ca3af',    // Text secondary
    700: '#d1d5db',    // Text emphasis
    800: '#e5e7eb',    // Text high contrast
    900: '#f3f4f6',    // Text primary - maximum contrast
  },
  
  // Professional legal status colors
  status: {
    draft: '#6b7280',      // Neutral gray
    active: '#1e3a8a',     // Navy blue - active cases
    pending: '#f59e0b',    // Amber - pending review
    completed: '#22c55e',  // Clean green - completed
    archived: '#4b5563',   // Muted gray - archived
    urgent: '#ef4444',     // Red - urgent attention
    review: '#6366f1',     // Indigo - under review
  },
  
  // Document priority colors
  priority: {
    low: '#22c55e',        // Green - low priority
    medium: '#f59e0b',     // Amber - medium priority
    high: '#f97316',       // Orange - high priority
    critical: '#ef4444',   // Red - critical priority
  },
} as const;

// Typography Scale - Enhanced for legal document readability
export const typography = {
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    legal: '"Georgia", "Times New Roman", serif', // For legal documents
    monospace: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace',
    heading: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px - captions, metadata
    sm: '0.875rem',    // 14px - UI text, secondary content
    base: '1rem',      // 16px - body text, primary content
    lg: '1.125rem',    // 18px - large body text, legal documents
    xl: '1.25rem',     // 20px - subheadings
    '2xl': '1.5rem',   // 24px - section headings
    '3xl': '1.875rem', // 30px - page headings
    '4xl': '2.25rem',  // 36px - main headings
    '5xl': '3rem',     // 48px - display headings
    '6xl': '3.75rem',  // 60px - hero headings
  },
  
  fontWeight: {
    light: 300,        // Light weight for large headings
    normal: 400,       // Normal body text
    medium: 500,       // Emphasized text, UI elements
    semibold: 600,     // Subheadings, important UI text
    bold: 700,         // Headings, key information
    extrabold: 800,    // Display headings
  },
  
  lineHeight: {
    none: 1,           // Tight for headings
    tight: 1.25,       // Headings, display text
    snug: 1.375,       // UI text, compact layouts
    normal: 1.5,       // Body text, comfortable reading
    relaxed: 1.625,    // Legal documents, long-form content
    loose: 2,          // Very spacious, special cases
  },
  
  letterSpacing: {
    tighter: '-0.05em',   // Large headings
    tight: '-0.025em',    // Headings
    normal: '0em',        // Body text
    wide: '0.025em',      // UI text, buttons
    wider: '0.05em',      // Small caps, captions
    widest: '0.1em',      // All caps, overlines
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

// Shadow System - Sophisticated professional depth with dark mode support
export const shadows = {
  none: 'none',
  
  // Light mode shadows - subtle and professional
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
  
  // Professional interactive shadows - navy accent
  interactive: '0 8px 32px rgba(30, 58, 138, 0.15)', // Navy glow
  primaryGlow: '0 0 20px rgba(30, 58, 138, 0.3)',    // Strong navy glow
  panel: '0 4px 20px rgba(0, 0, 0, 0.08)',
  float: '0 12px 24px rgba(0, 0, 0, 0.15)',
  
  // Dark mode shadows - enhanced for midnight blue theme
  dark: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.4)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.7)',
    
    // Enhanced dark mode specific shadows
    panel: '0 8px 32px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)',
    interactive: '0 8px 32px rgba(30, 58, 138, 0.2)', // Stronger navy glow for dark
    primaryGlow: '0 0 24px rgba(30, 58, 138, 0.4)',
    float: '0 16px 32px rgba(0, 0, 0, 0.7), 0 8px 16px rgba(0, 0, 0, 0.5)',
    
    // Sophisticated surface elevation
    surface: {
      1: '0 1px 3px rgba(0, 0, 0, 0.4)',
      2: '0 2px 6px rgba(0, 0, 0, 0.5)',
      3: '0 4px 12px rgba(0, 0, 0, 0.6)',
      4: '0 8px 24px rgba(0, 0, 0, 0.7)',
      5: '0 16px 48px rgba(0, 0, 0, 0.8)',
    },
  },
  
  // Light mode surface elevation
  surface: {
    1: '0 1px 3px rgba(0, 0, 0, 0.08)',
    2: '0 2px 6px rgba(0, 0, 0, 0.1)',
    3: '0 4px 12px rgba(0, 0, 0, 0.12)',
    4: '0 8px 24px rgba(0, 0, 0, 0.15)',
    5: '0 16px 48px rgba(0, 0, 0, 0.2)',
  },
} as const;

// Animation System - Sophisticated professional micro-interactions
export const animations = {
  duration: {
    instant: '75ms',    // Instant feedback
    fastest: '100ms',   // Button presses, micro-interactions
    fast: '150ms',      // Hover states, small animations
    normal: '200ms',    // Standard transitions
    slow: '300ms',      // Page transitions, large movements
    slower: '500ms',    // Complex animations
    slowest: '750ms',   // Dramatic effects
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Professional easing curves for legal software
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',        // Natural, smooth movement
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // Playful bounce
    professional: 'cubic-bezier(0.16, 1, 0.3, 1)',     // Confident, authoritative
    elegant: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',   // Refined, sophisticated
    snappy: 'cubic-bezier(0.33, 1.53, 0.69, 0.99)',    // Quick, responsive
  },
  
  // Professional transition patterns
  transition: {
    // Basic transitions
    instant: '75ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Specific property transitions
    colors: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    transform: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Complex professional transitions
    all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    panel: 'width 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    elevation: 'box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
    
    // Interactive element transitions
    button: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 100ms cubic-bezier(0.16, 1, 0.3, 1)',
    input: 'border-color 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    card: 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  
  // Keyframes and complex animations
  keyframes: {
    fadeIn: {
      '0%': { opacity: 0, transform: 'translateY(10px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
    slideInLeft: {
      '0%': { opacity: 0, transform: 'translateX(-20px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' },
    },
    slideInRight: {
      '0%': { opacity: 0, transform: 'translateX(20px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' },
    },
    float: {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-6px)' },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.7 },
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
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
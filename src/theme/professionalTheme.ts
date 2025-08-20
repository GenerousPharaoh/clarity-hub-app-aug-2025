import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';
import { designTokens } from './designTokens';

const { colors, typography, spacing, borderRadius, shadows, animations } = designTokens;

// Professional theme configuration for legal software
const createProfessionalTheme = (mode: 'light' | 'dark' = 'light'): ThemeOptions => {
  const isLight = mode === 'light';
  
  return {
    palette: {
      mode,
      
      // Primary blue - Professional interaction color
      primary: {
        main: colors.primary[500],
        light: colors.primary[400],
        dark: colors.primary[600],
        contrastText: '#ffffff',
        ...(isLight ? {
          50: colors.primary[50],
          100: colors.primary[100],
          200: colors.primary[200],
          300: colors.primary[300],
          400: colors.primary[400],
          500: colors.primary[500],
          600: colors.primary[600],
          700: colors.primary[700],
          800: colors.primary[800],
          900: colors.primary[900],
        } : {
          50: colors.primary[900],
          100: colors.primary[800],
          200: colors.primary[700],
          300: colors.primary[600],
          400: colors.primary[500],
          500: colors.primary[400],
          600: colors.primary[300],
          700: colors.primary[200],
          800: colors.primary[100],
          900: colors.primary[50],
        }),
      },
      
      // Secondary - Subtle professional accent
      secondary: {
        main: isLight ? colors.neutral[600] : colors.neutral[400],
        light: isLight ? colors.neutral[500] : colors.neutral[300],
        dark: isLight ? colors.neutral[700] : colors.neutral[500],
        contrastText: isLight ? '#ffffff' : colors.neutral[900],
      },
      
      // Semantic colors
      success: {
        main: colors.success[500],
        light: colors.success[400],
        dark: colors.success[600],
        contrastText: '#ffffff',
      },
      
      warning: {
        main: colors.warning[500],
        light: colors.warning[400],
        dark: colors.warning[600],
        contrastText: '#ffffff',
      },
      
      error: {
        main: colors.error[500],
        light: colors.error[400],
        dark: colors.error[600],
        contrastText: '#ffffff',
      },
      
      info: {
        main: colors.primary[500],
        light: colors.primary[400],
        dark: colors.primary[600],
        contrastText: '#ffffff',
      },
      
      // Background colors - Sophisticated dark theme with midnight blue
      background: {
        default: isLight ? colors.neutral[50] : colors.dark[50], // Deep midnight blue for dark mode
        paper: isLight ? '#ffffff' : colors.dark[100], // Dark slate for panels
      },
      
      // Text colors - High contrast for legal documents with sophisticated dark theme
      text: {
        primary: isLight ? colors.neutral[900] : colors.dark[900], // Maximum contrast text
        secondary: isLight ? colors.neutral[600] : colors.dark[600], // Secondary text
        disabled: isLight ? colors.neutral[500] : colors.dark[500], // Disabled text
      },
      
      // Dividers and borders
      divider: isLight 
        ? alpha(colors.neutral[900], 0.08)
        : alpha(colors.dark[600], 0.12),
      
      // Professional action colors
      action: {
        active: isLight ? colors.neutral[700] : colors.dark[500],
        hover: isLight 
          ? alpha(colors.neutral[900], 0.04)
          : alpha(colors.dark[600], 0.08),
        selected: isLight
          ? alpha(colors.primary[500], 0.08)
          : alpha(colors.primary[400], 0.16),
        disabled: isLight ? colors.neutral[500] : colors.dark[400],
        disabledBackground: isLight 
          ? alpha(colors.neutral[900], 0.02)
          : alpha(colors.dark[600], 0.04),
        focus: isLight
          ? alpha(colors.primary[500], 0.12)
          : alpha(colors.primary[400], 0.24),
      },
      
      // Grey palette for consistency
      grey: isLight ? {
        50: colors.neutral[50],
        100: colors.neutral[100],
        200: colors.neutral[200],
        300: colors.neutral[300],
        400: colors.neutral[400],
        500: colors.neutral[500],
        600: colors.neutral[600],
        700: colors.neutral[700],
        800: colors.neutral[800],
        900: colors.neutral[900],
        A100: colors.neutral[100],
        A200: colors.neutral[200],
        A400: colors.neutral[400],
        A700: colors.neutral[700],
      } : {
        50: colors.dark[900],
        100: colors.dark[800],
        200: colors.dark[700],
        300: colors.dark[600],
        400: colors.dark[500],
        500: colors.dark[400],
        600: colors.dark[300],
        700: colors.dark[200],
        800: colors.dark[100],
        900: colors.dark[50],
        A100: colors.dark[800],
        A200: colors.dark[700],
        A400: colors.dark[500],
        A700: colors.dark[200],
      },
    },
    
    // Professional typography scale
    typography: {
      fontFamily: typography.fontFamily.primary,
      
      // Headings optimized for legal documents
      h1: {
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.tight,
        color: isLight ? colors.neutral[900] : colors.dark[600],
      },
      
      h2: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.tight,
        color: isLight ? colors.neutral[900] : colors.dark[600],
      },
      
      h3: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.snug,
        letterSpacing: typography.letterSpacing.normal,
        color: isLight ? colors.neutral[800] : colors.dark[600],
      },
      
      h4: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.snug,
        letterSpacing: typography.letterSpacing.normal,
        color: isLight ? colors.neutral[800] : colors.dark[600],
      },
      
      h5: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
        color: isLight ? colors.neutral[800] : colors.dark[600],
      },
      
      h6: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
        color: isLight ? colors.neutral[800] : colors.dark[600],
      },
      
      // Body text optimized for readability
      body1: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.relaxed,
        letterSpacing: typography.letterSpacing.normal,
        color: isLight ? colors.neutral[800] : colors.dark[600],
      },
      
      body2: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
        color: isLight ? colors.neutral[700] : colors.dark[500],
      },
      
      // UI text
      subtitle1: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
        color: isLight ? colors.neutral[800] : colors.dark[600],
      },
      
      subtitle2: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.wide,
        color: isLight ? colors.neutral[700] : colors.dark[500],
      },
      
      caption: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.wide,
        color: isLight ? colors.neutral[600] : colors.dark[400],
      },
      
      overline: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.widest,
        textTransform: 'uppercase',
        color: isLight ? colors.neutral[600] : colors.dark[400],
      },
      
      // Button text
      button: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.wide,
        textTransform: 'none',
      },
    },
    
    // Professional shape/border radius
    shape: {
      borderRadius: parseInt(borderRadius.base.replace('rem', '')) * 16, // Convert to px
    },
    
    // Spacing system
    spacing: (factor: number) => `${0.25 * factor}rem`,
    
    // Shadows system
    shadows: [
      'none',
      shadows.xs,
      shadows.sm,
      shadows.base,
      shadows.md,
      shadows.lg,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
    ],
    
    // Transitions
    transitions: {
      duration: {
        shortest: parseInt(animations.duration.instant.replace('ms', '')),
        shorter: parseInt(animations.duration.fast.replace('ms', '')),
        short: parseInt(animations.duration.normal.replace('ms', '')),
        standard: parseInt(animations.duration.slow.replace('ms', '')),
        complex: parseInt(animations.duration.slower.replace('ms', '')),
        enteringScreen: parseInt(animations.duration.slow.replace('ms', '')),
        leavingScreen: parseInt(animations.duration.normal.replace('ms', '')),
      },
      easing: {
        easeInOut: animations.easing.easeInOut,
        easeOut: animations.easing.easeOut,
        easeIn: animations.easing.easeIn,
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    
    // Z-index system
    zIndex: {
      mobileStepper: 1000,
      fab: 1050,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    },
  };
};

// Create the professional theme
export const createProfessionalMuiTheme = (mode: 'light' | 'dark' = 'light') => {
  const themeOptions = createProfessionalTheme(mode);
  return createTheme(themeOptions);
};

export default createProfessionalMuiTheme;
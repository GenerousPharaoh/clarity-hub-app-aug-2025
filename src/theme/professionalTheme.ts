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
      
      // Background — three-tier surface hierarchy
      background: {
        default: isLight ? colors.neutral[50] : colors.dark[50],   // Base layer hsl(220,14%,96%)
        paper: isLight ? '#ffffff' : colors.dark[100],              // Content panels pure white
      },

      // Text — near-black primary, never pure #000
      text: {
        primary: isLight ? colors.neutral[800] : colors.dark[900],    // hsl(220,14%,12%)
        secondary: isLight ? colors.neutral[600] : colors.dark[600],  // hsl(220,10%,42%)
        disabled: isLight ? colors.neutral[500] : colors.dark[500],   // hsl(220,8%,62%)
      },
      
      // Dividers and borders — hsl(220,10%,90%) solid, not alpha
      divider: isLight
        ? colors.neutral[200]
        : alpha(colors.dark[300], 0.5),
      
      // Professional action colors — stronger alphas for visibility
      action: {
        active: isLight ? colors.neutral[700] : colors.neutral[600],
        hover: isLight
          ? alpha(colors.neutral[900], 0.06)
          : alpha(colors.neutral[700], 0.12),
        selected: isLight
          ? alpha(colors.primary[500], 0.12)
          : alpha(colors.primary[400], 0.20),
        disabled: isLight ? colors.neutral[500] : colors.neutral[400],
        disabledBackground: isLight
          ? alpha(colors.neutral[900], 0.02)
          : alpha(colors.neutral[600], 0.04),
        focus: isLight
          ? alpha(colors.primary[500], 0.16)
          : alpha(colors.primary[400], 0.28),
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
    
    // Typography — spec: 20px page title, 14px section, 13.5px body, 12px caption
    // -0.01em letter-spacing on all weights >= 600
    typography: {
      fontFamily: typography.fontFamily.primary,

      h1: {
        fontSize: '2.5rem',     // 40px
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: '-0.02em',
        color: isLight ? colors.neutral[800] : colors.dark[900],
      },

      h2: {
        fontSize: '1.75rem',    // 28px
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
        color: isLight ? colors.neutral[800] : colors.dark[900],
      },

      h3: {
        fontSize: '1.25rem',    // 20px — page title stop
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
        color: isLight ? colors.neutral[800] : colors.dark[900],
      },

      h4: {
        fontSize: '1rem',       // 16px
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
        color: isLight ? colors.neutral[800] : colors.dark[900],
      },

      h5: {
        fontSize: '0.875rem',   // 14px — section header / card title
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: '-0.01em',
        color: isLight ? colors.neutral[800] : colors.dark[900],
      },

      h6: {
        fontSize: '0.875rem',   // 14px
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: '-0.01em',
        color: isLight ? colors.neutral[800] : colors.dark[900],
      },

      // Body — 13.5px, weight 400, line-height 1.6
      body1: {
        fontSize: '0.844rem',   // ~13.5px
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: '0em',
        color: isLight ? colors.neutral[600] : colors.dark[600],
      },

      body2: {
        fontSize: '0.844rem',   // ~13.5px
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: '0em',
        color: isLight ? colors.neutral[600] : colors.dark[500],
      },

      subtitle1: {
        fontSize: '0.875rem',   // 14px
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: '-0.01em',
        color: isLight ? colors.neutral[800] : colors.dark[900],
      },

      subtitle2: {
        fontSize: '0.844rem',   // 13.5px
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0em',
        color: isLight ? colors.neutral[600] : colors.dark[600],
      },

      // Caption — 12px, weight 450, letter-spacing 0.01em
      caption: {
        fontSize: '0.75rem',    // 12px
        fontWeight: 450,
        lineHeight: 1.5,
        letterSpacing: '0.01em',
        color: isLight ? colors.neutral[500] : colors.dark[400],
      },

      overline: {
        fontSize: '0.75rem',
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0.01em',
        textTransform: 'none' as const,  // No uppercase transforms
        color: isLight ? colors.neutral[500] : colors.dark[400],
      },

      // Buttons — 13.5px / 500 weight
      button: {
        fontSize: '0.844rem',
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0em',
        textTransform: 'none' as const,
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
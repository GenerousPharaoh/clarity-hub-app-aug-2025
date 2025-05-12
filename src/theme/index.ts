import { createTheme, ThemeOptions } from '@mui/material/styles';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Define light theme options
export const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1D4ED8', // Modern blue
      light: '#60A5FA',
      dark: '#1E40AF',
    },
    secondary: {
      main: '#7C3AED', // Modern purple
      light: '#A78BFA',
      dark: '#5B21B6',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
      disabled: '#9CA3AF',
    },
    error: {
      main: '#EF4444',
      light: '#FCA5A5',
      dark: '#B91C1C',
    },
    warning: {
      main: '#F59E0B',
      light: '#FCD34D',
      dark: '#B45309',
    },
    info: {
      main: '#3B82F6',
      light: '#93C5FD',
      dark: '#1D4ED8',
    },
    success: {
      main: '#10B981',
      light: '#6EE7B7',
      dark: '#065F46',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", sans-serif',
    allVariants: { letterSpacing: '-0.01em' },
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: 'none',
          padding: '8px 16px',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          boxShadow: '0px 1px 2px rgba(29, 78, 216, 0.15)',
        },
        containedSecondary: {
          boxShadow: '0px 1px 2px rgba(124, 58, 237, 0.15)',
        },
        outlined: {
          borderWidth: 1.5,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          color: '#111827',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.04), 0px 8px 15px rgba(0, 0, 0, 0.02)',
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.04), 0px 8px 15px rgba(0, 0, 0, 0.02)',
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.02)',
        },
        elevation2: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.04), 0px 8px 15px rgba(0, 0, 0, 0.02)',
        },
        elevation3: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06), 0px 12px 20px rgba(0, 0, 0, 0.03)',
        },
        elevation4: {
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08), 0px 16px 24px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 8,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 0',
          overflow: 'hidden',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(29, 78, 216, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(29, 78, 216, 0.12)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '12px 0',
          borderColor: 'rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(29, 78, 216, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1D4ED8',
              borderWidth: 1.5,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          '&.MuiChip-filled': {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
        },
      },
    },
  },
};

// Define dark theme options
export const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#60A5FA', // Modern blue for dark mode
      light: '#93C5FD',
      dark: '#3B82F6',
    },
    secondary: {
      main: '#A78BFA', // Modern purple for dark mode
      light: '#C4B5FD',
      dark: '#7C3AED',
    },
    background: {
      default: '#111827',
      paper: '#1F2937',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      disabled: '#6B7280',
    },
    error: {
      main: '#F87171',
      light: '#FCA5A5',
      dark: '#EF4444',
    },
    warning: {
      main: '#FBBF24',
      light: '#FCD34D',
      dark: '#F59E0B',
    },
    info: {
      main: '#60A5FA',
      light: '#93C5FD',
      dark: '#3B82F6',
    },
    success: {
      main: '#34D399',
      light: '#6EE7B7',
      dark: '#10B981',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", sans-serif',
    allVariants: { letterSpacing: '-0.01em' },
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: 'none',
          padding: '8px 16px',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0px 2px 8px rgba(0,0,0,0.4)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          boxShadow: '0px 1px 2px rgba(96, 165, 250, 0.2)',
        },
        containedSecondary: {
          boxShadow: '0px 1px 2px rgba(167, 139, 250, 0.2)',
        },
        outlined: {
          borderWidth: 1.5,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(31, 41, 55, 0.8)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2), 0px 12px 24px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2), 0px 12px 24px rgba(0, 0, 0, 0.1)',
          backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
        },
        elevation1: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2), 0px 4px 8px rgba(0, 0, 0, 0.15)',
        },
        elevation2: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2), 0px 8px 16px rgba(0, 0, 0, 0.15)',
        },
        elevation3: {
          boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.25), 0px 12px 24px rgba(0, 0, 0, 0.2)',
        },
        elevation4: {
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.3), 0px 16px 32px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 8,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 0',
          overflow: 'hidden',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(96, 165, 250, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(96, 165, 250, 0.25)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '12px 0',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(96, 165, 250, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#60A5FA',
              borderWidth: 1.5,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          '&.MuiChip-filled': {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
        },
      },
    },
  },
};

// Create the light and dark themes
export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Export default theme (light)
export default lightTheme; 
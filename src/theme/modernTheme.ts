import { createTheme, alpha } from '@mui/material/styles';

export const createModernTheme = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563eb', // Modern blue
        light: '#3b82f6',
        dark: '#1e40af',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#7c3aed', // Modern purple
        light: '#8b5cf6',
        dark: '#6d28d9',
        contrastText: '#ffffff',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      info: {
        main: '#06b6d4',
        light: '#22d3ee',
        dark: '#0891b2',
      },
      background: {
        default: isLight ? '#ffffff' : '#0f172a',
        paper: isLight ? '#ffffff' : '#1e293b',
      },
      text: {
        primary: isLight ? '#0f172a' : '#f1f5f9',
        secondary: isLight ? '#475569' : '#94a3b8',
      },
      divider: isLight ? alpha('#94a3b8', 0.12) : alpha('#475569', 0.12),
    },
    typography: {
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        letterSpacing: '0.02em',
      },
      caption: {
        fontSize: '0.75rem',
        letterSpacing: '0.03em',
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      'none',
      '0px 1px 2px rgba(0, 0, 0, 0.05)',
      '0px 1px 3px rgba(0, 0, 0, 0.1)',
      '0px 2px 4px rgba(0, 0, 0, 0.1)',
      '0px 3px 6px rgba(0, 0, 0, 0.1)',
      '0px 4px 8px rgba(0, 0, 0, 0.1)',
      '0px 5px 10px rgba(0, 0, 0, 0.1)',
      '0px 6px 12px rgba(0, 0, 0, 0.1)',
      '0px 7px 14px rgba(0, 0, 0, 0.1)',
      '0px 8px 16px rgba(0, 0, 0, 0.1)',
      '0px 9px 18px rgba(0, 0, 0, 0.1)',
      '0px 10px 20px rgba(0, 0, 0, 0.1)',
      '0px 11px 22px rgba(0, 0, 0, 0.1)',
      '0px 12px 24px rgba(0, 0, 0, 0.1)',
      '0px 13px 26px rgba(0, 0, 0, 0.1)',
      '0px 14px 28px rgba(0, 0, 0, 0.1)',
      '0px 15px 30px rgba(0, 0, 0, 0.1)',
      '0px 16px 32px rgba(0, 0, 0, 0.1)',
      '0px 17px 34px rgba(0, 0, 0, 0.1)',
      '0px 18px 36px rgba(0, 0, 0, 0.1)',
      '0px 19px 38px rgba(0, 0, 0, 0.1)',
      '0px 20px 40px rgba(0, 0, 0, 0.1)',
      '0px 21px 42px rgba(0, 0, 0, 0.1)',
      '0px 22px 44px rgba(0, 0, 0, 0.1)',
      '0px 24px 48px rgba(0, 0, 0, 0.15)',
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
          },
          elevation2: {
            boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
          },
          elevation3: {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
            borderRadius: 12,
            '&:hover': {
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${isLight ? alpha('#94a3b8', 0.12) : alpha('#475569', 0.12)}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${isLight ? alpha('#94a3b8', 0.12) : alpha('#475569', 0.12)}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginBottom: 2,
            '&.Mui-selected': {
              backgroundColor: isLight ? alpha('#2563eb', 0.08) : alpha('#3b82f6', 0.16),
              '&:hover': {
                backgroundColor: isLight ? alpha('#2563eb', 0.12) : alpha('#3b82f6', 0.24),
              },
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: isLight ? alpha('#94a3b8', 0.24) : alpha('#475569', 0.24),
              },
              '&:hover fieldset': {
                borderColor: isLight ? alpha('#94a3b8', 0.4) : alpha('#475569', 0.4),
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 6,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isLight ? '#1e293b' : '#0f172a',
            color: '#f1f5f9',
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: 6,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&:hover': {
              backgroundColor: isLight ? alpha('#94a3b8', 0.08) : alpha('#475569', 0.08),
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            minHeight: 48,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isLight ? alpha('#94a3b8', 0.12) : alpha('#475569', 0.12),
          },
        },
      },
    },
  });
};
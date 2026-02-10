import { createTheme, alpha } from '@mui/material/styles';

// Premium dark slate palette — authoritative, sophisticated, legal-grade
const PRIMARY = '#1e293b';       // Slate 800 — deep, authoritative
const PRIMARY_LIGHT = '#334155'; // Slate 700 — hover/lighter states
const PRIMARY_DARK = '#0f172a';  // Slate 900 — pressed/darkest
const ACCENT = '#3b82f6';        // Blue 500 — secondary accent (links, highlights)

export const createModernTheme = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';

  // --- Palette ---
  const dividerColor = isLight ? alpha('#94a3b8', 0.18) : alpha('#475569', 0.22);

  return createTheme({
    palette: {
      mode,
      primary: {
        main: PRIMARY,
        light: PRIMARY_LIGHT,
        dark: PRIMARY_DARK,
        contrastText: '#ffffff',
      },
      secondary: {
        main: ACCENT,
        light: '#60a5fa',
        dark: '#2563eb',
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
        default: isLight ? '#f8fafc' : '#0c0f1a',
        paper: isLight ? '#ffffff' : '#151928',
      },
      text: {
        primary: isLight ? '#0f172a' : '#f1f5f9',
        secondary: isLight ? '#475569' : '#94a3b8',
        disabled: isLight ? '#94a3b8' : '#475569',
      },
      divider: dividerColor,
      action: {
        active: isLight ? '#475569' : '#94a3b8',
        hover: isLight ? alpha(PRIMARY, 0.05) : alpha(PRIMARY_LIGHT, 0.10),
        selected: isLight ? alpha(PRIMARY, 0.08) : alpha(PRIMARY_LIGHT, 0.16),
        disabled: isLight ? '#94a3b8' : '#475569',
        disabledBackground: isLight ? alpha('#94a3b8', 0.08) : alpha('#475569', 0.08),
        focus: isLight ? alpha(PRIMARY, 0.12) : alpha(PRIMARY_LIGHT, 0.22),
      },
    },

    // --- Typography ---
    typography: {
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
      h2: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
      h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
      h4: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 },
      h5: { fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.5 },
      h6: { fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5 },
      subtitle1: { fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 },
      subtitle2: { fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.5 },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
      button: { textTransform: 'none' as const, fontWeight: 600, letterSpacing: '0.01em', fontSize: '0.8125rem' },
      caption: { fontSize: '0.75rem', letterSpacing: '0.02em', fontWeight: 400 },
      overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const },
    },

    shape: { borderRadius: 10 },

    // --- Shadows — cool-tinted, layered ---
    shadows: [
      'none',
      `0 1px 2px ${isLight ? 'rgba(15,23,42,0.04)' : 'rgba(0,0,0,0.20)'}`,
      `0 1px 4px ${isLight ? 'rgba(15,23,42,0.06)' : 'rgba(0,0,0,0.25)'}`,
      `0 2px 8px ${isLight ? 'rgba(15,23,42,0.08)' : 'rgba(0,0,0,0.30)'}`,
      `0 4px 12px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 6px 16px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 8px 20px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 10px 24px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 12px 28px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 14px 32px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 16px 36px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 18px 40px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 20px 44px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 22px 48px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 24px 52px ${isLight ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.35)'}`,
      `0 32px 64px ${isLight ? 'rgba(15,23,42,0.14)' : 'rgba(0,0,0,0.50)'}`,
    ],

    // --- Component overrides ---
    components: {
      // ---- CssBaseline ----
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: `${isLight ? '#d1d5db' : '#374151'} transparent`,
            '&::-webkit-scrollbar': { width: 7, height: 7 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: isLight ? '#d1d5db' : '#374151',
              borderRadius: 4,
              '&:hover': { background: isLight ? '#9ca3af' : '#4b5563' },
            },
          },
        },
      },

      // ---- AppBar — clean white with subtle border ----
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isLight ? '#ffffff' : '#151928',
            color: isLight ? '#0f172a' : '#f1f5f9',
            boxShadow: 'none',
            borderBottom: `1px solid ${dividerColor}`,
          },
        },
      },

      // ---- Buttons — solid dark, premium feel ----
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: '0.8125rem',
            boxShadow: 'none',
            transition: 'all 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            '&:hover': { boxShadow: 'none' },
          },
          contained: {
            background: PRIMARY,
            color: '#ffffff',
            boxShadow: `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)`,
            '&:hover': {
              background: PRIMARY_LIGHT,
              boxShadow: `0 4px 12px rgba(0,0,0,0.15)`,
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
              background: PRIMARY_DARK,
            },
            '&.Mui-disabled': {
              background: isLight ? '#e2e8f0' : '#334155',
              color: isLight ? '#94a3b8' : '#475569',
              boxShadow: 'none',
            },
          },
          outlined: {
            borderWidth: 1.5,
            borderColor: alpha(PRIMARY, 0.5),
            color: PRIMARY,
            '&:hover': {
              borderWidth: 1.5,
              backgroundColor: alpha(PRIMARY, 0.06),
              borderColor: PRIMARY,
            },
          },
          text: {
            color: isLight ? '#475569' : '#94a3b8',
            '&:hover': {
              backgroundColor: alpha(PRIMARY, 0.08),
              color: PRIMARY,
            },
          },
        },
      },

      // ---- Card — accent line on hover, lift ----
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            border: `1px solid ${dividerColor}`,
            boxShadow: isLight
              ? '0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(0,0,0,0.03)'
              : '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'all 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            position: 'relative' as const,
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0, left: 0, right: 0, height: 3,
              background: PRIMARY,
              opacity: 0,
              transition: 'opacity 200ms ease',
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isLight
                ? `0 8px 30px ${alpha(PRIMARY, 0.12)}, 0 4px 12px rgba(0,0,0,0.06)`
                : `0 8px 30px rgba(0,0,0,0.4), 0 4px 12px ${alpha(PRIMARY, 0.1)}`,
              borderColor: alpha(PRIMARY, 0.25),
              '&::before': { opacity: 1 },
            },
          },
        },
      },

      // ---- Paper ----
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          elevation1: { boxShadow: isLight ? '0 1px 3px rgba(15,23,42,0.05)' : '0 1px 3px rgba(0,0,0,0.3)' },
          elevation2: { boxShadow: isLight ? '0 2px 8px rgba(15,23,42,0.07)' : '0 2px 8px rgba(0,0,0,0.35)' },
          elevation3: { boxShadow: isLight ? '0 4px 14px rgba(15,23,42,0.09)' : '0 4px 14px rgba(0,0,0,0.4)' },
        },
      },

      // ---- Tabs — thick indicator with glow, selected tab bg ----
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 44,
          },
          indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
            backgroundColor: PRIMARY,
            boxShadow: `0 0 8px ${alpha(PRIMARY, 0.35)}`,
          },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none' as const,
            fontWeight: 500,
            fontSize: '0.8125rem',
            minHeight: 44,
            transition: 'all 150ms ease',
            '&.Mui-selected': {
              fontWeight: 600,
              color: PRIMARY,
              backgroundColor: alpha(PRIMARY, 0.06),
              borderRadius: '10px 10px 0 0',
            },
          },
        },
      },

      // ---- List item button — gradient selected, visible hover ----
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginBottom: 2,
            transition: 'all 150ms ease',
            '&:hover': {
              backgroundColor: alpha(PRIMARY, 0.06),
            },
            '&.Mui-selected': {
              background: `linear-gradient(90deg, ${alpha(PRIMARY, 0.13)} 0%, ${alpha(PRIMARY, 0.03)} 100%)`,
              borderLeft: `3px solid ${PRIMARY}`,
              '& .MuiListItemText-primary': {
                color: PRIMARY,
                fontWeight: 600,
              },
              '&:hover': {
                backgroundColor: alpha(PRIMARY, 0.16),
              },
            },
          },
        },
      },

      // ---- Chip — indigo-tinted fills ----
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 8,
          },
          filled: {
            backgroundColor: alpha(PRIMARY, 0.10),
            color: PRIMARY,
            '&:hover': {
              backgroundColor: alpha(PRIMARY, 0.18),
            },
          },
        },
      },

      // ---- Outlined Input — bigger focus ring ----
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: PRIMARY,
              boxShadow: `0 0 0 4px ${alpha(PRIMARY, 0.12)}`,
            },
          },
          notchedOutline: {
            borderColor: isLight ? alpha('#94a3b8', 0.24) : alpha('#475569', 0.30),
            transition: 'all 150ms ease',
          },
        },
      },

      // ---- Text field ----
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: isLight ? alpha('#94a3b8', 0.24) : alpha('#475569', 0.30),
              },
              '&:hover fieldset': {
                borderColor: isLight ? alpha('#94a3b8', 0.5) : alpha('#475569', 0.5),
              },
            },
          },
        },
      },

      // ---- Dialog — depth shadow with indigo tint ----
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: `1px solid ${dividerColor}`,
            boxShadow: isLight
              ? `0 24px 48px rgba(15,23,42,0.14), 0 8px 24px ${alpha(PRIMARY, 0.08)}`
              : `0 24px 48px rgba(0,0,0,0.5), 0 8px 24px ${alpha(PRIMARY, 0.06)}`,
          },
        },
      },

      // ---- Menu / MenuItem — visible hover ----
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${dividerColor}`,
            boxShadow: isLight
              ? '0 4px 16px rgba(15,23,42,0.10), 0 12px 32px rgba(15,23,42,0.06)'
              : '0 4px 16px rgba(0,0,0,0.4)',
            marginTop: 4,
          },
          list: { padding: 6 },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 4px',
            padding: '8px 12px',
            fontSize: '0.8125rem',
            transition: 'background-color 120ms ease',
            '&:hover': {
              backgroundColor: alpha(PRIMARY, 0.06),
            },
            '&.Mui-selected': {
              backgroundColor: alpha(PRIMARY, 0.10),
              '&:hover': { backgroundColor: alpha(PRIMARY, 0.14) },
            },
          },
        },
      },

      // ---- IconButton — visible hover ----
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'all 150ms ease',
            '&:hover': {
              backgroundColor: alpha(PRIMARY, 0.08),
            },
          },
        },
      },

      // ---- Drawer ----
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${dividerColor}`,
            backgroundColor: isLight ? '#ffffff' : '#151928',
          },
        },
      },

      // ---- Divider ----
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: dividerColor },
        },
      },

      // ---- Tooltip ----
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isLight ? '#1e293b' : '#0f172a',
            color: '#f1f5f9',
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: 8,
            boxShadow: isLight
              ? '0 4px 12px rgba(0,0,0,0.12)'
              : '0 4px 12px rgba(0,0,0,0.4)',
          },
        },
      },

      // ---- Alert ----
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },

      // ---- Switch ----
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: PRIMARY,
              opacity: 1,
            },
          },
        },
      },
    },
  });
};

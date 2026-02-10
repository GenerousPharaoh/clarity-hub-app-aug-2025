import { Theme, alpha, Components } from '@mui/material/styles';
import { designTokens } from './designTokens';

const { colors, shadows, animations, borderRadius } = designTokens;

// Professional component overrides for legal software
export const createComponentOverrides = (theme: Theme): Components<Omit<Theme, 'components'>> => ({
  // Global CSS baseline
  MuiCssBaseline: {
    styleOverrides: {
      '*': {
        boxSizing: 'border-box',
      },
      
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        height: '100%',
        width: '100%',
      },
      
      body: {
        height: '100%',
        width: '100%',
        margin: 0,
        padding: 0,
        overscrollBehavior: 'none',
        
        // Professional scrollbars
        scrollbarWidth: 'thin',
        scrollbarColor: `${theme.palette.mode === 'dark' ? colors.dark[300] : colors.neutral[300]} transparent`,
        
        '&::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? colors.dark[300] : colors.neutral[300],
          borderRadius: 4,
          
          '&:hover': {
            background: theme.palette.mode === 'dark' ? colors.dark[400] : colors.neutral[400],
          },
        },
        
        '&::-webkit-scrollbar-corner': {
          background: 'transparent',
        },
      },
      
      '#root': {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      },
      
      // Remove focus outlines for mouse users
      '.js-focus-visible :focus:not([data-focus-visible-added])': {
        outline: 'none',
      },
    },
  },

  // App Bar — subtle gradient bg, backdrop blur, modern feel
  MuiAppBar: {
    styleOverrides: {
      root: {
        background: theme.palette.mode === 'dark'
          ? theme.palette.background.paper
          : 'linear-gradient(135deg, #ffffff 0%, #F5F3FF 100%)',
        color: theme.palette.text.primary,
        boxShadow: '0 1px 3px rgba(99, 102, 241, 0.06), 0 1px 2px rgba(31, 44, 71, 0.04)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        backdropFilter: 'blur(8px)',

        '&.MuiAppBar-positionFixed': {
          zIndex: theme.zIndex.appBar,
        },
      },

      colorPrimary: {
        background: theme.palette.mode === 'dark'
          ? theme.palette.background.paper
          : 'linear-gradient(135deg, #ffffff 0%, #F5F3FF 100%)',
        color: theme.palette.text.primary,
      },
    },
  },

  // Button — gradient contained, smooth transitions, visible hover states
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        textTransform: 'none' as const,
        fontWeight: 500,
        fontSize: '0.844rem',
        lineHeight: 1.5,
        padding: '10px 16px',
        minHeight: 36,
        transition: 'all 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',

        '&:disabled': {
          transform: 'none',
        },
      },

      contained: {
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        color: '#ffffff',
        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',

        '&:hover': {
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
          transform: 'translateY(-1px)',
        },

        '&:active': {
          transform: 'translateY(0)',
          boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)',
        },
      },

      outlined: {
        borderWidth: 1,
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
        backgroundColor: 'transparent',

        '&:hover': {
          borderWidth: 1,
          backgroundColor: colors.primary[50],
          borderColor: theme.palette.primary.dark,
        },
      },

      text: {
        padding: '6px 12px',

        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
        },
      },

      sizeSmall: {
        padding: '6px 12px',
        minHeight: 32,
        fontSize: '0.75rem',
      },

      sizeLarge: {
        padding: '12px 24px',
        minHeight: 44,
        fontSize: '0.875rem',
      },
    },
  },

  // Card — gradient accent line on hover, lift effect, modern feel
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: 12,
        boxShadow: theme.palette.mode === 'dark' ? shadows.dark.sm : shadows.sm,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        padding: 0,
        position: 'relative' as const,
        overflow: 'hidden',

        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
          opacity: 0,
          transition: 'opacity 200ms ease',
        },

        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.12), 0 4px 12px rgba(31, 44, 71, 0.08)',
          borderColor: alpha('#6366F1', 0.3),
          '&::before': {
            opacity: 1,
          },
        },
      },
    },
  },

  // Paper - Base surface component
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backgroundColor: theme.palette.background.paper,
      },
      
      outlined: {
        borderColor: theme.palette.divider,
        backgroundColor: theme.palette.background.paper,
      },
      
      elevation1: {
        boxShadow: theme.palette.mode === 'dark' ? shadows.dark.xs : shadows.xs,
      },
      
      elevation2: {
        boxShadow: theme.palette.mode === 'dark' ? shadows.dark.sm : shadows.sm,
      },
      
      elevation4: {
        boxShadow: theme.palette.mode === 'dark' ? shadows.dark.base : shadows.base,
      },
      
      elevation8: {
        boxShadow: theme.palette.mode === 'dark' ? shadows.dark.lg : shadows.lg,
      },
    },
  },

  // Text Fields - Professional input styling
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiInputLabel-root': {
          color: theme.palette.text.secondary,
          fontSize: theme.typography.body2.fontSize,
          fontWeight: theme.typography.fontWeightMedium,
        },
        
        '& .MuiInputLabel-root.Mui-focused': {
          color: theme.palette.primary.main,
        },
      },
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: parseInt(borderRadius.md.replace('rem', '')) * 16,
        backgroundColor: theme.palette.background.paper,
        transition: animations.transition.fast,
        
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.text.secondary,
        },
        
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
          boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
        },
        
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.error.main,
          
          '&:focus-within': {
            boxShadow: `0 0 0 3px ${alpha(theme.palette.error.main, 0.08)}`,
          },
        },
      },
      
      notchedOutline: {
        borderColor: theme.palette.divider,
        transition: animations.transition.fast,
      },
      
      input: {
        padding: '12px 14px',
        fontSize: theme.typography.body1.fontSize,
        lineHeight: theme.typography.body1.lineHeight,
        
        '&::placeholder': {
          color: theme.palette.text.disabled,
          opacity: 1,
        },
      },
      
      sizeSmall: {
        '& .MuiOutlinedInput-input': {
          padding: '8px 12px',
        },
      },
    },
  },

  // Select - Professional dropdown styling
  MuiSelect: {
    styleOverrides: {
      root: {
        borderRadius: parseInt(borderRadius.md.replace('rem', '')) * 16,
      },
      
      icon: {
        color: theme.palette.text.secondary,
        transition: animations.transition.fast,
        
        '&.Mui-disabled': {
          color: theme.palette.text.disabled,
        },
      },
    },
  },

  // Menu - Professional dropdown menu
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: parseInt(borderRadius.lg.replace('rem', '')) * 16,
        boxShadow: theme.palette.mode === 'dark' ? shadows.dark.lg : shadows.lg,
        border: `1px solid ${theme.palette.divider}`,
        marginTop: 4,
        minWidth: 200,
      },
      
      list: {
        padding: 8,
      },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        margin: '2px 4px',
        padding: '8px 12px',
        fontSize: '0.844rem',
        transition: 'background-color 120ms ease',

        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
        },

        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.10),

          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.14),
          },
        },
      },
    },
  },

  // Dialog - Professional modal styling
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: parseInt(borderRadius.xl.replace('rem', '')) * 16,
        boxShadow: '0 24px 48px rgba(31, 44, 71, 0.16), 0 8px 24px rgba(99, 102, 241, 0.08)',
        border: `1px solid ${theme.palette.divider}`,
        backgroundImage: 'none',
      },
      
      paperWidthSm: {
        maxWidth: 480,
      },
      
      paperWidthMd: {
        maxWidth: 720,
      },
      
      paperWidthLg: {
        maxWidth: 960,
      },
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: {
        padding: '24px 24px 16px',
        fontSize: theme.typography.h5.fontSize,
        fontWeight: theme.typography.fontWeightSemiBold,
        color: theme.palette.text.primary,
      },
    },
  },

  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '0 24px',
        color: theme.palette.text.primary,
      },
    },
  },

  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '16px 24px 24px',
        gap: 8,
      },
    },
  },

  // Tabs — active: accent text + 2px bottom border; inactive: secondary text, no underline
  MuiTabs: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${theme.palette.divider}`,
        minHeight: 40,
      },

      indicator: {
        height: 3,
        borderRadius: '3px 3px 0 0',
        backgroundColor: theme.palette.primary.main,
        boxShadow: '0 0 8px rgba(99,102,241,0.3)',
      },

      flexContainer: {
        gap: 4,
      },
    },
  },

  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        fontSize: '0.844rem',
        fontWeight: 500,
        color: theme.palette.text.secondary,
        padding: '10px 16px',
        minHeight: 40,
        transition: 'color 120ms ease',

        '&:hover': {
          color: theme.palette.text.primary,
          backgroundColor: 'transparent',
        },

        '&.Mui-selected': {
          color: theme.palette.primary.main,
          fontWeight: 600,
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
          borderRadius: '8px 8px 0 0',
        },
      },
    },
  },

  // Table - Professional data table styling
  MuiTableContainer: {
    styleOverrides: {
      root: {
        borderRadius: parseInt(borderRadius.lg.replace('rem', '')) * 16,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      },
    },
  },

  MuiTable: {
    styleOverrides: {
      root: {
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
    },
  },

  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: theme.palette.mode === 'dark' ? colors.dark[100] : colors.neutral[50],
      },
    },
  },

  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottomColor: theme.palette.divider,
        padding: '16px',
        fontSize: theme.typography.body2.fontSize,
        lineHeight: theme.typography.body2.lineHeight,
      },
      
      head: {
        backgroundColor: 'inherit',
        color: theme.palette.text.primary,
        fontWeight: theme.typography.fontWeightSemiBold,
        fontSize: theme.typography.body2.fontSize,
        borderBottomWidth: 2,
        borderBottomColor: theme.palette.divider,
      },
      
      body: {
        color: theme.palette.text.primary,
        
        '&:last-child': {
          paddingRight: 24,
        },
      },
    },
  },

  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: animations.transition.fast,
        
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        },
        
        '&:last-child td': {
          borderBottom: 'none',
        },
      },
      
      head: {
        '&:hover': {
          backgroundColor: 'transparent',
        },
      },
    },
  },

  // Chip — compact with 120ms transitions
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontSize: '0.75rem',
        fontWeight: 500,
        height: 24,
        transition: 'background-color 120ms ease',

        '& .MuiChip-label': {
          padding: '0 8px',
        },
      },
      
      filled: {
        backgroundColor: alpha(theme.palette.primary.main, 0.10),
        color: theme.palette.primary.main,
        fontWeight: 500,

        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.18),
        },
      },
      
      outlined: {
        borderColor: theme.palette.divider,
        backgroundColor: 'transparent',
        
        '&:hover': {
          backgroundColor: alpha(theme.palette.text.primary, 0.04),
        },
      },
    },
  },

  // Alert - Professional notification styling
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: parseInt(borderRadius.lg.replace('rem', '')) * 16,
        border: `1px solid transparent`,
        
        '& .MuiAlert-icon': {
          marginRight: 12,
          padding: 0,
          opacity: 1,
        },
        
        '& .MuiAlert-message': {
          padding: 0,
          color: 'inherit',
        },
      },
      
      standardSuccess: {
        backgroundColor: alpha(colors.success[500], 0.1),
        borderColor: alpha(colors.success[500], 0.2),
        color: theme.palette.mode === 'dark' ? colors.success[400] : colors.success[700],
      },
      
      standardError: {
        backgroundColor: alpha(colors.error[500], 0.1),
        borderColor: alpha(colors.error[500], 0.2),
        color: theme.palette.mode === 'dark' ? colors.error[400] : colors.error[700],
      },
      
      standardWarning: {
        backgroundColor: alpha(colors.warning[500], 0.1),
        borderColor: alpha(colors.warning[500], 0.2),
        color: theme.palette.mode === 'dark' ? colors.warning[400] : colors.warning[700],
      },
      
      standardInfo: {
        backgroundColor: alpha(colors.primary[500], 0.1),
        borderColor: alpha(colors.primary[500], 0.2),
        color: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[700],
      },
    },
  },

  // Divider - Professional separator styling
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: theme.palette.divider,
        opacity: 1,
      },
      
      withChildren: {
        '&::before, &::after': {
          borderColor: theme.palette.divider,
        },
      },
    },
  },

  // Tooltip - Professional helper text styling
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: theme.palette.mode === 'dark' ? colors.dark[800] : colors.neutral[800],
        color: theme.palette.mode === 'dark' ? colors.dark[100] : '#ffffff',
        fontSize: theme.typography.caption.fontSize,
        padding: '8px 12px',
        borderRadius: parseInt(borderRadius.md.replace('rem', '')) * 16,
        boxShadow: theme.palette.mode === 'dark' ? shadows.dark.lg : shadows.lg,
        maxWidth: 300,
      },
      
      arrow: {
        color: theme.palette.mode === 'dark' ? colors.dark[800] : colors.neutral[800],
      },
    },
  },

  // Backdrop - Professional overlay styling
  MuiBackdrop: {
    styleOverrides: {
      root: {
        backgroundColor: alpha(theme.palette.common.black, 0.5),
        backdropFilter: 'blur(4px)',
      },
    },
  },

  // Drawer - Professional sidebar styling
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.divider,
        borderWidth: 1,
      },
      
      paperAnchorLeft: {
        borderRight: `1px solid ${theme.palette.divider}`,
        borderLeft: 'none',
      },
      
      paperAnchorRight: {
        borderLeft: `1px solid ${theme.palette.divider}`,
        borderRight: 'none',
      },
    },
  },

  // List - Professional list styling
  MuiList: {
    styleOverrides: {
      root: {
        padding: '8px 0',
      },
    },
  },

  MuiListItem: {
    styleOverrides: {
      root: {
        paddingTop: 4,
        paddingBottom: 4,
        
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          borderRadius: parseInt(borderRadius.base.replace('rem', '')) * 16,
          margin: '2px 8px',
          
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
          },
        },
      },
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        margin: '1px 8px',
        padding: '8px 12px',
        transition: 'background-color 120ms ease, color 120ms ease',

        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
        },

        '&.Mui-selected': {
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
          borderLeft: '3px solid',
          borderLeftColor: theme.palette.primary.main,

          '& .MuiListItemText-primary': {
            color: theme.palette.primary.main,
            fontWeight: 600,
          },

          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
          },
        },
      },
    },
  },

  MuiListItemText: {
    styleOverrides: {
      primary: {
        fontSize: theme.typography.body2.fontSize,
        fontWeight: theme.typography.fontWeightMedium,
        color: theme.palette.text.primary,
      },
      
      secondary: {
        fontSize: theme.typography.caption.fontSize,
        color: theme.palette.text.secondary,
      },
    },
  },

  // Switch - Professional toggle styling
  MuiSwitch: {
    styleOverrides: {
      root: {
        width: 52,
        height: 32,
        padding: 0,
        
        '& .MuiSwitch-switchBase': {
          padding: 0,
          margin: 2,
          transitionDuration: '300ms',
          
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            color: '#fff',
            
            '& + .MuiSwitch-track': {
              backgroundColor: theme.palette.primary.main,
              opacity: 1,
              border: 0,
            },
          },
          
          '&.Mui-disabled + .MuiSwitch-track': {
            opacity: 0.5,
          },
        },
        
        '& .MuiSwitch-thumb': {
          boxSizing: 'border-box',
          width: 28,
          height: 28,
          boxShadow: theme.palette.mode === 'dark' ? shadows.dark.sm : shadows.sm,
        },
        
        '& .MuiSwitch-track': {
          borderRadius: 16,
          backgroundColor: theme.palette.mode === 'dark' ? colors.dark[300] : colors.neutral[300],
          opacity: 1,
          transition: theme.transitions.create(['background-color'], {
            duration: 500,
          }),
        },
      },
    },
  },
});
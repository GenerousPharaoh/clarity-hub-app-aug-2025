import React from 'react';
import { GlobalStyles as MuiGlobalStyles, useTheme } from '@mui/material';
import { designTokens, professionalAnimations } from './index';

const { colors, animations } = designTokens;

export const ProfessionalGlobalStyles: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <MuiGlobalStyles
      styles={{
        // Professional CSS custom properties for consistent theming
        ':root': {
          // Color tokens
          '--color-primary-50': colors.primary[50],
          '--color-primary-100': colors.primary[100],
          '--color-primary-200': colors.primary[200],
          '--color-primary-300': colors.primary[300],
          '--color-primary-400': colors.primary[400],
          '--color-primary-500': colors.primary[500],
          '--color-primary-600': colors.primary[600],
          '--color-primary-700': colors.primary[700],
          '--color-primary-800': colors.primary[800],
          '--color-primary-900': colors.primary[900],

          // Neutral colors
          '--color-neutral-50': isDark ? colors.dark[900] : colors.neutral[50],
          '--color-neutral-100': isDark ? colors.dark[800] : colors.neutral[100],
          '--color-neutral-200': isDark ? colors.dark[700] : colors.neutral[200],
          '--color-neutral-300': isDark ? colors.dark[600] : colors.neutral[300],
          '--color-neutral-400': isDark ? colors.dark[500] : colors.neutral[400],
          '--color-neutral-500': isDark ? colors.dark[400] : colors.neutral[500],
          '--color-neutral-600': isDark ? colors.dark[300] : colors.neutral[600],
          '--color-neutral-700': isDark ? colors.dark[200] : colors.neutral[700],
          '--color-neutral-800': isDark ? colors.dark[100] : colors.neutral[800],
          '--color-neutral-900': isDark ? colors.dark[50] : colors.neutral[900],

          // Semantic colors
          '--color-success': colors.success[500],
          '--color-warning': colors.warning[500],
          '--color-error': colors.error[500],

          // Animation tokens
          '--duration-fast': animations.duration.fast,
          '--duration-normal': animations.duration.normal,
          '--duration-slow': animations.duration.slow,
          '--easing-ease-in-out': animations.easing.easeInOut,
          '--easing-ease-out': animations.easing.easeOut,

          // Shadow tokens
          '--shadow-sm': isDark ? '0 1px 3px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(31, 44, 71, 0.04), 0 4px 12px rgba(31, 44, 71, 0.03)',
          '--shadow-md': isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.4)' : '0 2px 6px rgba(31, 44, 71, 0.06), 0 8px 24px rgba(31, 44, 71, 0.05)',
          '--shadow-lg': isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(31, 44, 71, 0.08), 0 16px 40px rgba(31, 44, 71, 0.06)',
          '--shadow-interactive': '0 2px 6px rgba(31, 44, 71, 0.06), 0 8px 24px rgba(31, 44, 71, 0.05)',
          '--shadow-panel': 'none',
        },

        // Reset and base styles
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },

        '*::before, *::after': {
          boxSizing: 'border-box',
        },

        // Professional HTML and body styling
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          height: '100%',
          width: '100%',
          fontSize: '16px',
          lineHeight: 1.5,
          fontFamily: theme.typography.fontFamily,
          
          // Prevent zoom on iOS
          WebkitTextSizeAdjust: '100%',
          
          // Improve text rendering
          textRendering: 'optimizeLegibility',
          WebkitFontFeatureSettings: '"kern" 1',
          fontFeatureSettings: '"kern" 1',
        },

        body: {
          height: '100%',
          width: '100%',
          margin: 0,
          padding: 0,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body1.fontSize,
          lineHeight: theme.typography.body1.lineHeight,
          overscrollBehavior: 'none',
          
          // Professional scrollbars
          scrollbarWidth: 'thin',
          scrollbarColor: `${isDark ? colors.dark[300] : colors.neutral[300]} transparent`,
          
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
            backgroundColor: 'transparent',
          },
          
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isDark ? colors.dark[300] : colors.neutral[300],
            borderRadius: 4,
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            
            '&:hover': {
              backgroundColor: isDark ? colors.dark[400] : colors.neutral[400],
            },
            
            '&:active': {
              backgroundColor: isDark ? colors.dark[500] : colors.neutral[500],
            },
          },
          
          '&::-webkit-scrollbar-corner': {
            backgroundColor: 'transparent',
          },
        },

        '#root': {
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },

        // Professional focus styles
        '*:focus-visible': {
          outline: `2px solid ${colors.primary[500]}`,
          outlineOffset: 2,
          borderRadius: 4,
        },

        // Remove focus outline for mouse users
        '.js-focus-visible :focus:not([data-focus-visible-added])': {
          outline: 'none',
        },

        // Professional link styling
        a: {
          color: colors.primary[500],
          textDecoration: 'none',
          transition: animations.transition.colors,
          
          '&:hover': {
            color: colors.primary[600],
            textDecoration: 'underline',
          },
          
          '&:focus-visible': {
            outline: `2px solid ${colors.primary[500]}`,
            outlineOffset: 2,
            borderRadius: 2,
          },
        },

        // Professional heading styles
        'h1, h2, h3, h4, h5, h6': {
          fontWeight: theme.typography.fontWeightSemiBold,
          lineHeight: 1.25,
          color: theme.palette.text.primary,
          margin: 0,
        },

        // Professional paragraph spacing
        p: {
          margin: 0,
          lineHeight: 1.6,
          color: theme.palette.text.primary,
          
          '& + p': {
            marginTop: '1rem',
          },
        },

        // Professional list styling
        'ul, ol': {
          margin: 0,
          paddingLeft: '1.5rem',
          
          '& li': {
            margin: '0.25rem 0',
            lineHeight: 1.5,
          },
        },

        // Professional table styling
        table: {
          borderCollapse: 'collapse',
          borderSpacing: 0,
          width: '100%',
          
          '& th, & td': {
            textAlign: 'left',
            padding: '0.75rem',
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          
          '& th': {
            fontWeight: theme.typography.fontWeightSemiBold,
            backgroundColor: isDark ? colors.dark[100] : colors.neutral[50],
            color: theme.palette.text.primary,
          },
        },

        // Professional form element resets
        'input, textarea, select': {
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          margin: 0,
        },

        button: {
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          margin: 0,
          cursor: 'pointer',
          
          '&:disabled': {
            cursor: 'not-allowed',
          },
        },

        // Professional selection colors
        '::selection': {
          backgroundColor: `${colors.primary[500]}20`,
          color: theme.palette.text.primary,
        },

        '::-moz-selection': {
          backgroundColor: `${colors.primary[500]}20`,
          color: theme.palette.text.primary,
        },

        // Professional drag and drop styles
        '.drag-over': {
          backgroundColor: `${colors.primary[500]}08`,
          borderColor: colors.primary[500],
          
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `${colors.primary[500]}04`,
            pointerEvents: 'none',
          },
        },

        // Professional loading states
        '.loading-shimmer': {
          background: `linear-gradient(90deg, 
            ${isDark ? colors.dark[200] : colors.neutral[100]} 25%, 
            ${isDark ? colors.dark[100] : colors.neutral[50]} 50%, 
            ${isDark ? colors.dark[200] : colors.neutral[100]} 75%
          )`,
          backgroundSize: '200px 100%',
          animation: `${professionalAnimations.keyframes.shimmer} 1.5s infinite linear`,
        },

        '.loading-pulse': {
          animation: `${professionalAnimations.keyframes.pulse} 2s ${animations.easing.easeInOut} infinite`,
        },

        // Professional utility classes
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        },

        '.truncate': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },

        '.line-clamp-2': {
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
        },

        '.line-clamp-3': {
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 3,
          overflow: 'hidden',
        },

        // Professional responsive image styling
        img: {
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
        },

        // Professional code styling
        'pre, code': {
          fontFamily: theme.typography.fontFamily,
          fontSize: '0.875em',
          backgroundColor: isDark ? colors.dark[100] : colors.neutral[100],
          color: theme.palette.text.primary,
          borderRadius: 4,
        },

        code: {
          padding: '0.125rem 0.25rem',
        },

        pre: {
          padding: '1rem',
          overflow: 'auto',
          lineHeight: 1.5,
          
          '& code': {
            padding: 0,
            backgroundColor: 'transparent',
          },
        },

        // Professional print styles
        '@media print': {
          '*': {
            textShadow: 'none !important',
            boxShadow: 'none !important',
          },
          
          'a, a:visited': {
            textDecoration: 'underline',
          },
          
          'pre, blockquote': {
            border: `1px solid ${colors.neutral[400]}`,
            pageBreakInside: 'avoid',
          },
          
          'thead': {
            display: 'table-header-group',
          },
          
          'tr, img': {
            pageBreakInside: 'avoid',
          },
          
          'img': {
            maxWidth: '100% !important',
          },
          
          'p, h2, h3': {
            orphans: 3,
            widows: 3,
          },
          
          'h2, h3': {
            pageBreakAfter: 'avoid',
          },
        },

        // Professional high contrast mode support
        '@media (prefers-contrast: high)': {
          '*:focus-visible': {
            outline: '3px solid currentColor',
            outlineOffset: 3,
          },
        },

        // Professional reduced motion support
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      }}
    />
  );
};

export default ProfessionalGlobalStyles;
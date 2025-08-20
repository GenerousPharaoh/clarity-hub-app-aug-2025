import { createTheme, Theme } from '@mui/material/styles';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import { designTokens } from './designTokens';
import { createProfessionalMuiTheme } from './professionalTheme';
import { createComponentOverrides } from './componentOverrides';
import { professionalAnimations } from './animations';

// Create comprehensive professional theme for legal case management
const createLegalSoftwareTheme = (mode: 'light' | 'dark' = 'light'): Theme => {
  // Start with professional base theme
  const baseTheme = createProfessionalMuiTheme(mode);
  
  // Create final theme with component overrides
  const theme = createTheme({
    ...baseTheme,
    components: {
      ...baseTheme.components,
      ...createComponentOverrides(baseTheme),
    },
  });

  return theme;
};

// Export the main theme creator
export const getTheme = (mode: 'light' | 'dark' = 'light'): Theme => {
  return createLegalSoftwareTheme(mode);
};

// Export design system utilities for components
export { designTokens, professionalAnimations };

// Export theme variants for different contexts
export const themes = {
  light: createLegalSoftwareTheme('light'),
  dark: createLegalSoftwareTheme('dark'),
};

// Export utility functions for component styling
export const useDesignTokens = () => designTokens;
export const useAnimations = () => professionalAnimations;

// Export specific color palettes for legal contexts
export const legalColors = designTokens.legal;
export const statusColors = designTokens.legal.status;
export const priorityColors = designTokens.legal.priority;

// Professional breakpoint helpers
export const breakpointHelpers = {
  up: (breakpoint: keyof typeof designTokens.breakpoints) => 
    `@media (min-width: ${designTokens.breakpoints[breakpoint]})`,
  down: (breakpoint: keyof typeof designTokens.breakpoints) => 
    `@media (max-width: calc(${designTokens.breakpoints[breakpoint]} - 0.05px))`,
  between: (
    start: keyof typeof designTokens.breakpoints, 
    end: keyof typeof designTokens.breakpoints
  ) => 
    `@media (min-width: ${designTokens.breakpoints[start]}) and (max-width: calc(${designTokens.breakpoints[end]} - 0.05px))`,
};

// Professional spacing helpers
export const spacingHelpers = {
  get: (factor: keyof typeof designTokens.spacing) => designTokens.spacing[factor],
  getNumber: (factor: keyof typeof designTokens.spacing) => 
    parseFloat(designTokens.spacing[factor].replace('rem', '')) * 16, // Convert to px
};

// Professional shadow helpers
export const shadowHelpers = {
  get: (level: keyof typeof designTokens.shadows) => designTokens.shadows[level],
  getDark: (level: keyof typeof designTokens.shadows.dark) => designTokens.shadows.dark[level],
  interactive: designTokens.shadows.interactive,
  panel: designTokens.shadows.panel,
};

// Professional border radius helpers
export const borderRadiusHelpers = {
  get: (size: keyof typeof designTokens.borderRadius) => designTokens.borderRadius[size],
  getNumber: (size: keyof typeof designTokens.borderRadius) => 
    parseFloat(designTokens.borderRadius[size].replace('rem', '')) * 16, // Convert to px
};

// Professional typography helpers
export const typographyHelpers = {
  fontSize: designTokens.typography.fontSize,
  fontWeight: designTokens.typography.fontWeight,
  lineHeight: designTokens.typography.lineHeight,
  letterSpacing: designTokens.typography.letterSpacing,
  fontFamily: designTokens.typography.fontFamily,
};

// Color helpers for different modes
export const colorHelpers = {
  light: {
    primary: designTokens.colors.primary,
    neutral: designTokens.colors.neutral,
    success: designTokens.colors.success,
    warning: designTokens.colors.warning,
    error: designTokens.colors.error,
  },
  dark: {
    primary: designTokens.colors.primary,
    neutral: designTokens.colors.dark,
    success: designTokens.colors.success,
    warning: designTokens.colors.warning,
    error: designTokens.colors.error,
  },
};

// Professional animation helpers
export const animationHelpers = {
  duration: designTokens.animations.duration,
  easing: designTokens.animations.easing,
  transition: designTokens.animations.transition,
  createTransition: professionalAnimations.createTransition,
  createAnimation: professionalAnimations.createAnimation,
  hoverEffects: professionalAnimations.hoverEffects,
  microInteractions: professionalAnimations.microInteractions,
};

// Z-index helpers
export const zIndexHelpers = {
  get: (layer: keyof typeof designTokens.zIndex) => designTokens.zIndex[layer],
  layers: designTokens.zIndex,
};

// Component variant helpers
export const componentHelpers = {
  button: designTokens.components.button,
  input: designTokens.components.input,
  card: designTokens.components.card,
};

// Professional theme configuration for legal document editing
export const documentTheme = {
  background: designTokens.legal.document.background,
  paper: designTokens.legal.document.paper,
  margin: designTokens.legal.document.margin,
  text: designTokens.legal.document.text,
  heading: designTokens.legal.document.heading,
};

// Export default theme (light mode)
export default getTheme;
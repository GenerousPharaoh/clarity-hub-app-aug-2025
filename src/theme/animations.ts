import { keyframes } from '@mui/material/styles';
import { designTokens } from './designTokens';

const { animations } = designTokens;

// Professional animation keyframes for legal software
export const animationKeyframes = {
  // Fade animations
  fadeIn: keyframes`
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  `,

  fadeOut: keyframes`
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  `,

  // Scale animations - subtle professional scaling
  scaleIn: keyframes`
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  `,

  scaleOut: keyframes`
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  `,

  // Slide animations
  slideInUp: keyframes`
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,

  slideInDown: keyframes`
    from {
      opacity: 0;
      transform: translateY(-24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,

  slideInLeft: keyframes`
    from {
      opacity: 0;
      transform: translateX(-24px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `,

  slideInRight: keyframes`
    from {
      opacity: 0;
      transform: translateX(24px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `,

  // Professional loading animations
  pulse: keyframes`
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  `,

  shimmer: keyframes`
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  `,

  spin: keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  `,

  // Professional hover lift effect
  lift: keyframes`
    from {
      transform: translateY(0) scale(1);
    }
    to {
      transform: translateY(-2px) scale(1.02);
    }
  `,

  // Drawer slide animations
  drawerSlideIn: keyframes`
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  `,

  drawerSlideOut: keyframes`
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  `,

  // Modal animations
  modalFadeIn: keyframes`
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  `,

  modalFadeOut: keyframes`
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.9) translateY(-8px);
    }
  `,

  // Professional notification animations
  notificationSlideIn: keyframes`
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `,

  notificationSlideOut: keyframes`
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  `,

  // Progress bar animation
  progressIndeterminate: keyframes`
    0% {
      left: -35%;
      right: 100%;
    }
    60% {
      left: 100%;
      right: -90%;
    }
    100% {
      left: 100%;
      right: -90%;
    }
  `,

  // Typing indicator
  typingDot: keyframes`
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  `,
};

// Professional animation utilities
export const createAnimation = (
  name: keyof typeof animationKeyframes,
  duration: keyof typeof animations.duration = 'normal',
  easing: keyof typeof animations.easing = 'easeInOut',
  fillMode: 'none' | 'forwards' | 'backwards' | 'both' = 'both'
) => ({
  animation: `${animationKeyframes[name]} ${animations.duration[duration]} ${animations.easing[easing]} ${fillMode}`,
});

// Transition utilities
export const createTransition = (
  properties: string | string[],
  duration: keyof typeof animations.duration = 'normal',
  easing: keyof typeof animations.easing = 'easeInOut',
  delay: string = '0ms'
) => {
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  return `${props} ${animations.duration[duration]} ${animations.easing[easing]} ${delay}`;
};

// Professional hover effects
export const hoverEffects = {
  // Subtle lift effect for buttons
  lift: {
    transition: createTransition(['transform', 'box-shadow']),
    '&:hover': {
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },

  // Scale effect for interactive elements
  scale: {
    transition: createTransition('transform'),
    '&:hover': {
      transform: 'scale(1.02)',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  },

  // Glow effect for primary actions
  glow: {
    transition: createTransition(['box-shadow', 'background-color']),
    '&:hover': {
      boxShadow: '0 8px 32px rgba(37, 99, 235, 0.15)',
    },
  },

  // Border highlight for form elements
  borderHighlight: {
    transition: createTransition(['border-color', 'box-shadow']),
    '&:hover': {
      borderColor: 'rgba(37, 99, 235, 0.3)',
    },
    '&:focus-within': {
      borderColor: 'rgba(37, 99, 235, 1)',
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
    },
  },

  // Background highlight for cards
  backgroundHighlight: {
    transition: createTransition('background-color'),
    '&:hover': {
      backgroundColor: 'rgba(37, 99, 235, 0.02)',
    },
  },
};

// Loading skeleton animation
export const createSkeletonAnimation = (baseColor: string, highlightColor: string) => ({
  background: `linear-gradient(90deg, ${baseColor} 25%, ${highlightColor} 50%, ${baseColor} 75%)`,
  backgroundSize: '200px 100%',
  animation: `${animationKeyframes.shimmer} 1.5s infinite linear`,
});

// Professional staggered animations for lists
export const createStaggeredAnimation = (
  name: keyof typeof animationKeyframes,
  staggerDelay: number = 50,
  startIndex: number = 0
) => (index: number) => ({
  animation: `${animationKeyframes[name]} ${animations.duration.normal} ${animations.easing.easeOut} both`,
  animationDelay: `${(index + startIndex) * staggerDelay}ms`,
});

// Page transition animations
export const pageTransitions = {
  fadeIn: {
    animation: `${animationKeyframes.fadeIn} ${animations.duration.slow} ${animations.easing.easeOut} both`,
  },

  slideInUp: {
    animation: `${animationKeyframes.slideInUp} ${animations.duration.slow} ${animations.easing.easeOut} both`,
  },

  scaleIn: {
    animation: `${animationKeyframes.scaleIn} ${animations.duration.normal} ${animations.easing.easeOut} both`,
  },
};

// Professional loading states
export const loadingStates = {
  pulse: {
    animation: `${animationKeyframes.pulse} 2s ${animations.easing.easeInOut} infinite`,
  },

  shimmer: createSkeletonAnimation('rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.04)'),

  spin: {
    animation: `${animationKeyframes.spin} 1s ${animations.easing.linear} infinite`,
  },
};

// Micro-interaction animations
export const microInteractions = {
  // Button press feedback
  buttonPress: {
    transition: createTransition('transform', 'fast'),
    '&:active': {
      transform: 'scale(0.98)',
    },
  },

  // Checkbox/switch toggle
  toggle: {
    transition: createTransition(['transform', 'background-color'], 'normal'),
  },

  // Tab switching
  tabSwitch: {
    transition: createTransition(['color', 'border-color'], 'fast'),
  },

  // Menu item selection
  menuSelection: {
    transition: createTransition(['background-color', 'color'], 'fast'),
  },

  // Form field focus
  fieldFocus: {
    transition: createTransition(['border-color', 'box-shadow', 'background-color'], 'fast'),
  },

  // Card hover
  cardHover: {
    transition: createTransition(['transform', 'box-shadow'], 'normal'),
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
};

// Export all animation utilities
export const professionalAnimations = {
  keyframes: animationKeyframes,
  createAnimation,
  createTransition,
  hoverEffects,
  createSkeletonAnimation,
  createStaggeredAnimation,
  pageTransitions,
  loadingStates,
  microInteractions,
};
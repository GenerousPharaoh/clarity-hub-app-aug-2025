import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  actualMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Custom hook to use theme context
export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ProfessionalThemeProvider');
  }
  return context;
};

// Get system preference
const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Get stored preference
const getStoredPreference = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme-mode') as ThemeMode) || 'system';
};

// Store preference
const storePreference = (mode: ThemeMode) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme-mode', mode);
};

interface ProfessionalThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

// Professional theme provider with system preference support
export const ProfessionalThemeProvider: React.FC<ProfessionalThemeProviderProps> = ({ 
  children, 
  defaultMode = 'system' 
}) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');
  
  // Initialize theme mode on mount
  useEffect(() => {
    const storedMode = getStoredPreference();
    const systemPref = getSystemPreference();
    
    setModeState(storedMode);
    setSystemPreference(systemPref);
  }, []);
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    
    // Use addEventListener if available (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);
  
  // Calculate actual mode based on user preference and system
  const actualMode: 'light' | 'dark' = React.useMemo(() => {
    if (mode === 'system') {
      return systemPreference;
    }
    return mode;
  }, [mode, systemPreference]);
  
  // Set mode and persist to localStorage
  const setMode = React.useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    storePreference(newMode);
  }, []);
  
  // Toggle between light and dark (not system)
  const toggleMode = React.useCallback(() => {
    if (mode === 'system') {
      // If in system mode, switch to opposite of current system preference
      setMode(systemPreference === 'dark' ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      setMode(mode === 'dark' ? 'light' : 'dark');
    }
  }, [mode, systemPreference, setMode]);
  
  // Create theme based on actual mode
  const theme = React.useMemo(() => {
    return getTheme(actualMode);
  }, [actualMode]);
  
  // Update document class for external styling
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    document.documentElement.classList.remove('light-mode', 'dark-mode');
    document.documentElement.classList.add(`${actualMode}-mode`);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        actualMode === 'dark' ? '#0f172a' : '#f8f9fa'
      );
    }
  }, [actualMode]);
  
  const contextValue: ThemeContextValue = {
    mode,
    actualMode,
    setMode,
    toggleMode,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Theme mode toggle button component
export const ThemeModeToggle: React.FC<{ 
  className?: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ className, size = 'medium' }) => {
  const { mode, actualMode, toggleMode, setMode } = useThemeMode();
  
  const handleClick = () => {
    toggleMode();
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleMode();
    }
  };
  
  // Cycle through modes: system → light → dark → system
  const handleCycleMode = (event: React.MouseEvent) => {
    if (event.shiftKey) {
      event.preventDefault();
      if (mode === 'system') {
        setMode('light');
      } else if (mode === 'light') {
        setMode('dark');
      } else {
        setMode('system');
      }
    } else {
      toggleMode();
    }
  };
  
  const getIcon = () => {
    if (mode === 'system') {
      return '🌓'; // System mode
    }
    return actualMode === 'dark' ? '🌙' : '☀️';
  };
  
  const getTitle = () => {
    if (mode === 'system') {
      return `System (${actualMode}). Shift+click to cycle modes.`;
    }
    return `${actualMode === 'dark' ? 'Dark' : 'Light'} mode. Shift+click to cycle modes.`;
  };
  
  return (
    <button
      onClick={handleCycleMode}
      onKeyDown={handleKeyDown}
      className={className}
      title={getTitle()}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: size === 'small' ? '1rem' : size === 'large' ? '1.5rem' : '1.25rem',
        padding: '0.5rem',
        borderRadius: '0.375rem',
        transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '2.5rem',
        minHeight: '2.5rem',
      }}
    >
      {getIcon()}
    </button>
  );
};

// HOC for components that need theme awareness
export function withTheme<P extends object>(Component: React.ComponentType<P>) {
  const WrappedComponent = (props: P) => {
    const themeMode = useThemeMode();
    return <Component {...props} themeMode={themeMode} />;
  };
  
  WrappedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Theme-aware CSS custom properties hook
export const useThemeCustomProperties = () => {
  const { actualMode } = useThemeMode();
  
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Set CSS custom properties based on theme mode
    if (actualMode === 'dark') {
      root.style.setProperty('--theme-background', '#0f172a');
      root.style.setProperty('--theme-surface', '#1e293b');
      root.style.setProperty('--theme-text-primary', '#f1f5f9');
      root.style.setProperty('--theme-text-secondary', '#cbd5e1');
      root.style.setProperty('--theme-border', 'rgba(255, 255, 255, 0.08)');
    } else {
      root.style.setProperty('--theme-background', '#f8f9fa');
      root.style.setProperty('--theme-surface', '#ffffff');
      root.style.setProperty('--theme-text-primary', '#1a1a1a');
      root.style.setProperty('--theme-text-secondary', '#666666');
      root.style.setProperty('--theme-border', '#e5e7eb');
    }
  }, [actualMode]);
};

export default ProfessionalThemeProvider;
import React, { createContext, useEffect, useContext, ReactNode } from 'react';
import { useUIStore } from '../../stores/useUIStore'; // Import useUIStore

// ThemeProvider will now directly consume from useUIStore for rendering and DOM manipulation
// It will not manage its own internal 'theme' state or expose 'setTheme'/'toggleTheme' actions.
// Those will be handled by useUIStore.

// Define a type for the context value that matches what ThemeProvider will expose
interface ThemeContextType {
  activeTheme: 'light' | 'dark'; // The actual theme applied to the DOM
  // No setters here, as useUIStore will be the single source of truth for changing theme
}

// Initialize the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Directly consume the user's preferred theme from useUIStore
  const uiStoreTheme = useUIStore((state) => state.theme);
  const setDarkModeInStore = useUIStore((state) => state.setDarkMode);

  // Derive the actual DOM 'data-theme' attribute value and darkMode state from uiStoreTheme
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let actualDataTheme: string | null = null;
    let actualDarkMode: boolean;

    if (uiStoreTheme === 'glass') {
      actualDataTheme = 'glass';
      actualDarkMode = true; // Glass is dark-based
    } else if (uiStoreTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      actualDataTheme = prefersDark ? 'dark' : 'light';
      actualDarkMode = prefersDark;
    } else if (uiStoreTheme === 'light') {
      actualDataTheme = 'light';
      actualDarkMode = false;
    } else { // 'dark' or 'classic' (default dark)
      actualDataTheme = 'dark'; // Default dark theme gets 'dark' data-theme or no attribute (if dark is default)
      actualDarkMode = true;
    }

    // Apply to document.documentElement
    if (actualDataTheme && actualDataTheme !== 'dark') { // Only set 'light' or 'glass'. 'dark' can be implied or handled by root
      document.documentElement.setAttribute('data-theme', actualDataTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Update localStorage
    localStorage.setItem('theme', actualDataTheme || 'dark'); // Store 'dark' if no specific data-theme

    // Update useUIStore's darkMode state
    const currentUIDarkMode = useUIStore.getState().darkMode;
    if (currentUIDarkMode !== actualDarkMode) {
      setDarkModeInStore(actualDarkMode);
    }

  }, [uiStoreTheme, setDarkModeInStore]); // Re-run when uiStoreTheme changes

  // Expose only the activeTheme for children components to consume if needed
  const activeTheme: 'light' | 'dark' = useUIStore((state) => state.darkMode ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

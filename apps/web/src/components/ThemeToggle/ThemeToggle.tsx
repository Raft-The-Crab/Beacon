import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext'; // Get activeTheme from here
import { useUIStore } from '../../stores/useUIStore'; // Get/set theme preference here
import styles from './ThemeToggle.module.css';

export const ThemeToggle: React.FC = () => {
  const { activeTheme } = useTheme(); // Get the currently applied theme
  const uiStoreTheme = useUIStore(state => state.theme);
  const setUIStoreTheme = useUIStore(state => state.setTheme);

  const handleToggle = () => {
    // Toggle the user's preference in useUIStore
    // 'classic' is the default dark mode; 'light' is light mode
    if (uiStoreTheme === 'light') {
      setUIStoreTheme('classic');
    } else {
      setUIStoreTheme('light');
    }
  };

  // Determine which icon to show based on the actively applied theme
  const Icon = activeTheme === 'dark' ? Sun : Moon;

  return (
    <button
      className={styles.themeToggle}
      onClick={handleToggle}
      aria-label={`Switch to ${activeTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Icon size={20} />
    </button>
  );
};
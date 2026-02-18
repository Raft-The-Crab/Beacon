// apps/web/src/components/ThemeToggle/ThemeSynchronizer.tsx
import { useEffect } from 'react';
import { useUIStore } from '../../stores/useUIStore';
// Removed: import { useTheme } from './ThemeContext'; // No longer needed as ThemeProvider handles data-theme

export const ThemeSynchronizer: React.FC = () => {
  // Get theme preference from useUIStore
  const customBackground = useUIStore(state => state.customBackground);
  const customAccentColor = useUIStore(state => state.customAccentColor);

  // Effect to apply custom background
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (customBackground) {
      document.documentElement.style.setProperty('--custom-bg', `url(${customBackground})`);
    } else {
      document.documentElement.style.removeProperty('--custom-bg');
    }
  }, [customBackground]);

  // Effect to apply custom accent color
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (customAccentColor) {
      document.documentElement.style.setProperty('--beacon-brand', customAccentColor);
      document.documentElement.style.setProperty('--beacon-brand-hover', `${customAccentColor}cc`);
      document.documentElement.style.setProperty('--beacon-brand-muted', `${customAccentColor}1a`);
    } else {
      document.documentElement.style.removeProperty('--beacon-brand');
      document.documentElement.style.removeProperty('--beacon-brand-hover');
      document.documentElement.style.removeProperty('--beacon-brand-muted');
    }
  }, [customAccentColor]);

  // The last useEffect that caused loops is now removed.
  // ThemeProvider handles data-theme and useUIStore.setDarkMode logic.

  return null;
};
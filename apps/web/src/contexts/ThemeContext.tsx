import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'glass' | 'oled' | 'light' | 'neon' | 'midnight' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    isGlass: boolean;
    toggleGlass: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeType>(() => {
        return (localStorage.getItem('beacon-theme') as ThemeType) || 'glass';
    });

    const [isGlass, setIsGlass] = useState<boolean>(() => {
        return localStorage.getItem('beacon-glass-enabled') !== 'false';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('beacon-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (isGlass) {
            document.body.classList.add('glass-theme-active');
        } else {
            document.body.classList.remove('glass-theme-active');
        }
        localStorage.setItem('beacon-glass-enabled', isGlass.toString());
    }, [isGlass]);

    const setTheme = (newTheme: ThemeType) => setThemeState(newTheme);
    const toggleGlass = () => setIsGlass(prev => !prev);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isGlass, toggleGlass }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};

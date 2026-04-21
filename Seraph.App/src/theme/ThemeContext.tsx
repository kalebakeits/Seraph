import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme, theme as defaultTheme, type Theme } from './index';
import { palettes, type ThemeName } from './palettes';

const STORAGE_KEY = '@seraph/theme';

export interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  themeName: 'system',
  setTheme: () => undefined,
});

interface Props {
  children: React.ReactNode;
  initialTheme?: ThemeName;
}

export const ThemeProvider: React.FC<Props> = ({ children, initialTheme = 'system' }) => {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);
  const systemColorScheme = useColorScheme();

  const resolvedPalette = useMemo(() => {
    if (themeName === 'system') {
      return palettes[systemColorScheme === 'light' ? 'light' : 'dark'];
    }
    return palettes[themeName];
  }, [themeName, systemColorScheme]);

  const builtTheme = useMemo(() => buildTheme(resolvedPalette), [resolvedPalette]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    void AsyncStorage.setItem(STORAGE_KEY, name);
  }, []);

  const value = useMemo(
    () => ({ theme: builtTheme, themeName, setTheme }),
    [builtTheme, themeName, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export { STORAGE_KEY as THEME_STORAGE_KEY };

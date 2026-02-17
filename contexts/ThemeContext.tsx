import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, THEME_PRESETS, type ThemeId, type ThemeMode } from '../constants/storage';

export type ThemeColors = {
  primary: string;
  onPrimary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  paid: string;
  unpaid: string;
  border: string;
};

function getColorsForTheme(themeId: ThemeId): ThemeColors {
  const preset = THEME_PRESETS.find((p) => p.id === themeId) ?? THEME_PRESETS[0];
  const mode: ThemeMode = preset.mode;

  if (mode === 'light') {
    return {
      primary: preset.primary,
      onPrimary: '#1c1917',
      background: '#f5f5f4',
      surface: '#fafaf9',
      surfaceElevated: '#ffffff',
      text: '#44403c',
      textSecondary: '#78716c',
      paid: '#6ee7b7',
      unpaid: '#fde047',
      border: '#e7e5e4',
    };
  }

  if (mode === 'oled') {
    return {
      primary: preset.primary,
      onPrimary: '#0c0a09',
      background: '#000000',
      surface: '#0c0a09',
      surfaceElevated: '#1c1917',
      text: '#e7e5e4',
      textSecondary: '#a8a29e',
      paid: '#6ee7b7',
      unpaid: '#fde047',
      border: '#292524',
    };
  }

  return {
    primary: preset.primary,
    onPrimary: '#1c1917',
    background: '#1c1b1f',
    surface: '#2d2b32',
    surfaceElevated: '#3d3b42',
    text: '#e7e5e4',
    textSecondary: '#a8a29e',
    paid: '#6ee7b7',
    unpaid: '#fde047',
    border: '#3d3b42',
  };
}

type ThemeContextValue = {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>('blue');
  const [colors, setColors] = useState<ThemeColors>(() => getColorsForTheme('blue'));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.THEME).then((stored) => {
      const raw = stored ?? 'blue';
      let id: ThemeId;
      if (raw === 'dark') id = 'blueDark';
      else if (raw === 'black') id = 'blueOled';
      else if (THEME_PRESETS.some((p) => p.id === raw)) id = raw as ThemeId;
      else id = 'blue';
      setThemeIdState(id);
      setColors(getColorsForTheme(id));
    });
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    setColors(getColorsForTheme(id));
    AsyncStorage.setItem(STORAGE_KEYS.THEME, id);
  }, []);

  const isDark = colors.background === '#000000' || colors.background === '#1c1b1f';
  const value: ThemeContextValue = { themeId, setThemeId, colors, isDark };
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

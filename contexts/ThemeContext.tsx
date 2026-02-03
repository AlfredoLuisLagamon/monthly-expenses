import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, THEME_PRESETS, type ThemeId } from '../constants/storage';

export type ThemeColors = {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  paid: string;
  unpaid: string;
  border: string;
};

function getColorsForTheme(themeId: ThemeId): ThemeColors {
  const preset = THEME_PRESETS.find((p) => p.id === themeId) ?? THEME_PRESETS[0];
  const isDark = themeId === 'dark' || themeId === 'black';
  const isBlack = themeId === 'black';
  return {
    primary: preset.primary,
    background: isBlack ? '#000000' : isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? preset.surface : '#ffffff',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    paid: '#22c55e',
    unpaid: '#f59e0b',
    border: isBlack ? '#1f1f1f' : isDark ? '#334155' : '#e2e8f0',
  };
}

type ThemeContextValue = {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>('blue');
  const [colors, setColors] = useState<ThemeColors>(() => getColorsForTheme('blue'));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.THEME).then((stored) => {
      const id = (stored as ThemeId) ?? 'blue';
      if (THEME_PRESETS.some((p) => p.id === id)) {
        setThemeIdState(id as ThemeId);
        setColors(getColorsForTheme(id as ThemeId));
      }
    });
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    setColors(getColorsForTheme(id));
    AsyncStorage.setItem(STORAGE_KEYS.THEME, id);
  }, []);

  const value: ThemeContextValue = { themeId, setThemeId, colors };
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { SheetIdProvider } from '../contexts/SheetIdContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

const THEME_FADE_MS = 200;

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function ThemedNavigationBar() {
  const { colors, isDark } = useTheme();
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setBackgroundColorAsync(colors.surface);
    NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    NavigationBar.setBorderColorAsync(colors.border);
  }, [colors.surface, colors.border, isDark]);
  return null;
}

function ThemeTransitionWrapper({ children }: { children: React.ReactNode }) {
  const { themeId } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  const prevThemeId = useRef(themeId);

  useEffect(() => {
    if (prevThemeId.current !== themeId) {
      prevThemeId.current = themeId;
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: THEME_FADE_MS / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: THEME_FADE_MS / 2,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [themeId, opacity]);

  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <ThemedNavigationBar />
      <ThemeTransitionWrapper>
        <SheetIdProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="manage-options" />
            <Stack.Screen name="expense-form" />
          </Stack>
        </SheetIdProvider>
      </ThemeTransitionWrapper>
    </ThemeProvider>
  );
}

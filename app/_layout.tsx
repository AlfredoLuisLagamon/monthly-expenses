import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SheetIdProvider } from '../contexts/SheetIdContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function ThemedStatusBar() {
  const { themeId } = useTheme();
  const isDark = themeId === 'dark' || themeId === 'black';
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <SheetIdProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="manage-options" />
          <Stack.Screen name="expense-form" />
        </Stack>
      </SheetIdProvider>
    </ThemeProvider>
  );
}

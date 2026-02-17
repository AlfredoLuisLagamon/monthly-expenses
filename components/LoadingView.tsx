import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { space, radius, elevation } from '../constants/layout';
import { typography } from '../constants/typography';

type LoadingViewProps = {
  message?: string;
  fullScreen?: boolean;
};

export function LoadingView({ message = 'Loading…', fullScreen = true }: LoadingViewProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.centered, fullScreen && styles.fullScreen, { backgroundColor: colors.background }]}>
      <View style={[styles.pill, styles.pillElevation, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message ? (
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
  },
  fullScreen: {
    flex: 1,
  },
  pill: {
    padding: space.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    minWidth: 160,
  },
  pillElevation: { ...elevation.card },
  message: {
    marginTop: space.base,
    ...typography.bodyMedium,
  },
});

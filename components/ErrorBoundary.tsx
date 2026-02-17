import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { space, radius } from '../constants/layout';
import { typography } from '../constants/typography';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback error={this.state.error} onReset={this.reset} />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        The checklist had an error. Try again or pull to refresh.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onReset}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
  },
  title: { ...typography.titleLarge, marginBottom: space.sm },
  message: { ...typography.bodyMedium, textAlign: 'center', marginBottom: space.lg },
  button: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.full,
  },
  buttonText: { ...typography.labelLarge, fontWeight: '600' },
});

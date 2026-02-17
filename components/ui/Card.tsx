import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { space, radius, elevation } from '../../constants/layout';

type CardProps = {
  children: React.ReactNode;
  elevated?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/** M3-style card: surface with optional elevation. Uses surfaceElevated when elevated in dark/oled. */
export function Card({ children, elevated = true, style, contentStyle }: CardProps) {
  const { colors } = useTheme();
  const backgroundColor = elevated ? colors.surfaceElevated : colors.surface;

  return (
    <View style={[styles.card, { backgroundColor }, elevated && elevation.card, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  content: {
    padding: space.xl,
  },
});

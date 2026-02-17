import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { space, radius, typography, touchTargetMin, elevation } from '../../design-system/tokens';

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text';

type ButtonProps = {
  onPress: () => void;
  children: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  onPress,
  children,
  variant = 'filled',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  const isFilled = variant === 'filled';
  const isTonal = variant === 'tonal';
  const isOutlined = variant === 'outlined';
  const isText = variant === 'text';

  const bgColor = isFilled
    ? colors.primary
    : isTonal
      ? colors.primary + '20'
      : 'transparent';
  const borderWidth = isOutlined ? 2 : 0;
  const borderColor = isOutlined ? colors.primary : 'transparent';

  const textColor = isFilled || isTonal ? colors.primary : colors.text;
  const contentColor = isFilled ? colors.onPrimary : textColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          borderWidth,
          borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        (isFilled || isTonal) && elevation.raised,
        style,
      ]}
    >
      <Text style={[styles.label, { color: contentColor }, textStyle]} numberOfLines={1}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTargetMin,
    paddingVertical: space[2],
    paddingHorizontal: space[6],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
});

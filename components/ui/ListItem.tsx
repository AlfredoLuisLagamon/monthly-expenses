import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { space, radius, typography, touchTargetMin, elevation } from '../../design-system/tokens';

type ListItemProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
};

export function ListItem({
  title,
  subtitle,
  onPress,
  leading,
  trailing,
  style,
  disabled = false,
}: ListItemProps) {
  const { colors } = useTheme();

  const content = (
    <>
      {leading != null && <View style={styles.leading}>{leading}</View>}
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle != null && subtitle !== '' && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing != null && <View style={styles.trailing}>{trailing}</View>}
    </>
  );

  const containerStyle = [
    styles.root,
    { backgroundColor: colors.surface },
    elevation.surface,
  ];

  if (onPress != null && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled}
        style={[containerStyle, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[containerStyle, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  root: {
    minHeight: touchTargetMin + space[2],
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[4],
    paddingHorizontal: space[4],
    borderRadius: radius.md,
    marginBottom: space[2],
  },
  leading: { marginRight: space[4] },
  textWrap: { flex: 1, justifyContent: 'center', minWidth: 0 },
  title: { ...typography.titleMedium },
  subtitle: { ...typography.bodySmall, marginTop: 2 },
  trailing: { marginLeft: space[2] },
});

import React from 'react';
import { ScrollView, StyleSheet, ScrollViewProps } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { space } from '../tokens';

type ContentWrapperProps = ScrollViewProps & {
  children: React.ReactNode;
  /** Horizontal padding */
  paddingHorizontal?: number;
  /** Bottom padding (in addition to safe area) */
  paddingBottom?: number;
};

export function ContentWrapper({
  children,
  paddingHorizontal = space[4],
  paddingBottom = space[8],
  contentContainerStyle,
  ...rest
}: ContentWrapperProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal, paddingBottom },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
});

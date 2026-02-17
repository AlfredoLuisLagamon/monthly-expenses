import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { space, radius, icon, touchTargetMin, elevation } from '../constants/layout';
import { typography } from '../constants/typography';

type Props = {
  title: string;
  sortLabel: string;
  onPressSort: () => void;
};

export function SortBar({ title, sortLabel, onPressSort }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <TouchableOpacity
        style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPressSort}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="sort-variant" size={icon.sm} color={colors.primary} />
        <Text style={[styles.pillText, { color: colors.primary }]} numberOfLines={1}>
          {sortLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargetMin,
    paddingVertical: space.sm,
    paddingHorizontal: space.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: space.base,
  },
  title: {
    flex: 1,
    ...typography.headline,
    fontSize: 22,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    gap: space.xs,
    borderWidth: 1,
    ...elevation.raised,
  },
  pillText: { ...typography.labelMedium, fontWeight: '600' },
});

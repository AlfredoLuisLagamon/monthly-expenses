import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { space, radius, touchTargetMin, elevation } from '../constants/layout';
import { typography } from '../constants/typography';

type Props = {
  tabs: string[];
  selectedPayor: string;
  onSelect: (payor: string) => void;
  getCount: (payor: string) => number;
};

export function PayorTabs({ tabs, selectedPayor, onSelect, getCount }: Props) {
  const { colors } = useTheme();
  if (tabs.length === 0) return null;
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {tabs.map((payor) => {
          const selected = selectedPayor === payor;
          const count = getCount(payor);
          return (
            <TouchableOpacity
              key={payor}
              style={[
                styles.tab,
                selected && styles.tabSelected,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderWidth: selected ? 0 : 1,
                  borderColor: selected ? 'transparent' : colors.border,
                },
              ]}
              onPress={() => onSelect(payor)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.tabLabel, { color: selected ? colors.onPrimary : colors.text }]}
                numberOfLines={1}
              >
                {payor}
              </Text>
              <Text
                style={[styles.tabCount, { color: selected ? colors.onPrimary : colors.textSecondary }]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: space.sm,
    paddingHorizontal: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scroll: { minHeight: 40 },
  content: { gap: space.sm, paddingHorizontal: space.base },
  tab: {
    paddingHorizontal: space.base,
    paddingVertical: space.sm,
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: radius.full,
    marginRight: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  tabSelected: { ...elevation.raised },
  tabLabel: { ...typography.labelLarge, fontWeight: '600' },
  tabCount: { ...typography.labelMedium },
});

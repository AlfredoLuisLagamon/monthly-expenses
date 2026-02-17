import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { space, radius, icon, touchTargetMin, elevation } from '../constants/layout';
import { typography } from '../constants/typography';

export type SortOption<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: SortOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
};

export function SortModal<T extends string>({
  visible,
  onClose,
  title = 'Sort by',
  options,
  selectedId,
  onSelect,
}: Props<T>) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {options.map((opt) => {
            const selected = selectedId === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.option,
                  selected && { backgroundColor: colors.primary + '18' },
                ]}
                onPress={() => onSelect(opt.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>{opt.label}</Text>
                {selected && (
                  <MaterialCommunityIcons name="check" size={icon.md} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
  },
  content: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.lg,
    padding: space.xl,
    ...elevation.overlay,
  },
  title: {
    ...typography.headline,
    marginBottom: space.base,
    fontSize: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargetMin,
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    borderRadius: radius.sm,
  },
  optionText: { ...typography.bodyLarge },
});

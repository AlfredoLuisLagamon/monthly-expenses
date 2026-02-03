import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSheetId } from '../../contexts/SheetIdContext';
import { useExpenses } from '../../hooks/useExpenses';
import { deleteMasterRow } from '../../lib/api';
import { sortMaster } from '../../lib/sort';
import { spacing, borderRadius, iconSize } from '../../constants/layout';
import { STORAGE_KEYS, type ExpensesSortId } from '../../constants/storage';
import type { MasterRow } from '../../lib/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SORT_OPTIONS: { id: ExpensesSortId; label: string }[] = [
  { id: 'nameAsc', label: 'Name A–Z' },
  { id: 'nameDesc', label: 'Name Z–A' },
  { id: 'amountAsc', label: 'Amount (low first)' },
  { id: 'amountDesc', label: 'Amount (high first)' },
  { id: 'paymentMethod', label: 'Payment method' },
];

function MasterRowItem({
  row,
  sheetRowIndex,
  onEdit,
  onDelete,
  isDeleting,
}: {
  row: MasterRow;
  sheetRowIndex: number;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.rowMain} onPress={onEdit} disabled={isDeleting}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {row.Name}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {row['Payment Method']} · {row.Payor} {row.Amount ? `· ₱${row.Amount}` : ''}
        </Text>
      </TouchableOpacity>
      {isDeleting ? (
        <ActivityIndicator size="small" color={colors.unpaid} style={styles.deleteSpinner} />
      ) : (
        <TouchableOpacity onPress={onDelete} hitSlop={12}>
          <MaterialCommunityIcons name="delete-outline" size={iconSize.md} color={colors.unpaid} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const { sheetId } = useSheetId();
  const router = useRouter();
  const { data, loading, error, reload } = useExpenses();
  const [sortId, setSortId] = useState<ExpensesSortId>('nameAsc');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.SORT_EXPENSES).then((stored) => {
      if (stored && SORT_OPTIONS.some((o) => o.id === stored)) setSortId(stored as ExpensesSortId);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (sheetId) reload();
    }, [sheetId, reload])
  );

  const setSort = useCallback((id: ExpensesSortId) => {
    setSortId(id);
    AsyncStorage.setItem(STORAGE_KEYS.SORT_EXPENSES, id);
    setSortModalVisible(false);
  }, []);

  if (!data?.master && !loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="cloud-off-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.text, marginTop: spacing.base }]}>
          Set your Google Sheet ID in Settings first.
        </Text>
      </View>
    );
  }

  const master = data?.master ?? [];
  const sortedMaster = sortMaster(master, sortId);
  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sortId)?.label ?? 'Sort';

  const handleAdd = () => router.push({ pathname: '/expense-form', params: {} });
  const handleEdit = (row: MasterRow, sheetRowIndex: number) => {
    router.push({
      pathname: '/expense-form',
      params: {
        id: row.Id,
        name: row.Name,
        paymentMethod: row['Payment Method'],
        payor: row.Payor,
        amount: row.Amount,
        order: row.Order,
        sheetRowIndex: String(sheetRowIndex),
      },
    });
  };

  const handleDelete = (item: MasterRow, sheetRowIndex: number) => {
    if (!sheetId) return;
    Alert.alert('Delete expense', `Remove "${item.Name}" from the list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setDeletingId(sheetRowIndex);
          deleteMasterRow(sheetId, sheetRowIndex)
            .then(reload)
            .catch(() => {})
            .finally(() => setDeletingId(null));
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {error && (
        <View style={[styles.banner, { backgroundColor: colors.unpaid + '20' }]}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        </View>
      )}
      {loading && !data ? (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.sortBar, { borderBottomColor: colors.border }]}
            onPress={() => setSortModalVisible(true)}
          >
            <MaterialCommunityIcons name="sort" size={iconSize.sm} color={colors.primary} />
            <Text style={[styles.sortBarText, { color: colors.primary }]}>{currentSortLabel}</Text>
          </TouchableOpacity>
          <FlatList
            data={sortedMaster}
            keyExtractor={(item, i) => `${item.Id}-${i}`}
            renderItem={({ item, index }) => {
              const sheetRowIndex = master.indexOf(item) + 2;
              return (
                <MasterRowItem
                  row={item}
                  sheetRowIndex={sheetRowIndex}
                  onEdit={() => handleEdit(item, sheetRowIndex)}
                  onDelete={() => handleDelete(item, sheetRowIndex)}
                  isDeleting={deletingId === sheetRowIndex}
                />
              );
            }}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No expenses yet. Add one below.
              </Text>
            }
          />
        </>
      )}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleAdd}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.fabText}>Add expense</Text>
      </TouchableOpacity>
      <Modal visible={sortModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sort by</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.modalOption, sortId === opt.id && { backgroundColor: colors.primary + '20' }]}
                onPress={() => setSort(opt.id)}
              >
                <Text style={[styles.modalOptionText, { color: colors.text }]}>{opt.label}</Text>
                {sortId === opt.id && (
                  <MaterialCommunityIcons name="check" size={iconSize.md} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { marginTop: spacing.sm },
  banner: { padding: spacing.md, paddingHorizontal: spacing.base },
  errorText: { fontSize: 14 },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
  },
  sortBarText: { fontSize: 13, fontWeight: '500' },
  list: { padding: spacing.base, paddingBottom: 88 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  rowMain: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: spacing.xs },
  deleteSpinner: { marginLeft: spacing.md },
  emptyText: { textAlign: 'center', paddingVertical: spacing.xl },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    paddingVertical: spacing.base,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalContent: { width: '100%', maxWidth: 320, borderRadius: borderRadius.md, padding: spacing.base },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.sm },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: borderRadius.sm },
  modalOptionText: { fontSize: 16 },
});

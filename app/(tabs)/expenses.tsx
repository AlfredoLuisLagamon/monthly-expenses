import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSheetId } from '../../contexts/SheetIdContext';
import { useExpenses } from '../../hooks/useExpenses';
import { deleteMasterRow } from '../../lib/api';
import { sortMaster } from '../../lib/sort';
import { formatMonthYear } from '../../lib/month';
import { space, radius, icon, contentBottomWithFab, touchTargetMin, elevation } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { STORAGE_KEYS, type ExpensesSortId } from '../../constants/storage';
import type { MasterRow } from '../../lib/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LoadingView } from '../../components/LoadingView';
import { SortBar } from '../../components/SortBar';
import { PayorTabs } from '../../components/PayorTabs';
import { SortModal } from '../../components/SortModal';
import { impactFeedback } from '../../lib/haptics';

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
    <View style={[styles.row, styles.rowElevation, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={styles.rowMain} onPress={onEdit} disabled={isDeleting} activeOpacity={0.8}>
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
        <TouchableOpacity onPress={onDelete} hitSlop={12} activeOpacity={0.8}>
          <MaterialCommunityIcons name="delete-outline" size={icon.md} color={colors.unpaid} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const { sheetId } = useSheetId();
  const router = useRouter();
  const { data, loading, error, reload, month } = useExpenses();
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
        <MaterialCommunityIcons name="cloud-off-outline" size={icon.xxl} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.text, marginTop: space.base }]}>
          Set your Google Sheet ID in Settings first.
        </Text>
      </View>
    );
  }

  const master = data?.master ?? [];
  const payorsFromData = data?.payors ?? [];

  const { payorTabs, groupedByPayor } = useMemo(() => {
    if (!master.length) {
      return { payorTabs: [] as string[], groupedByPayor: new Map<string, { row: MasterRow; sheetRowIndex: number }[]>() };
    }
    const withIndex = master.map((row, i) => ({ row, sheetRowIndex: i + 2 }));
    const byPayor = new Map<string, { row: MasterRow; sheetRowIndex: number }[]>();
    withIndex.forEach(({ row, sheetRowIndex }) => {
      const payor = (row.Payor?.trim() ?? '') || 'Other';
      if (!byPayor.has(payor)) byPayor.set(payor, []);
      byPayor.get(payor)!.push({ row, sheetRowIndex });
    });
    let tabOrder = [...payorsFromData];
    if (byPayor.has('Other') && !payorsFromData.includes('Other')) tabOrder.push('Other');
    if (tabOrder.length === 0) {
      tabOrder = Array.from(byPayor.keys()).sort((a, b) =>
        a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)
      );
    }
    const tabs = tabOrder;
    const grouped = new Map<string, { row: MasterRow; sheetRowIndex: number }[]>();
    tabs.forEach((payor) => {
      const items = byPayor.get(payor) ?? [];
      const sorted = sortMaster(items.map((x) => x.row), sortId);
      const sortedWithIndex = sorted
        .map((row) => {
          const found = items.find((x) => x.row === row);
          return found ? { row: found.row, sheetRowIndex: found.sheetRowIndex } : null;
        })
        .filter((x): x is { row: MasterRow; sheetRowIndex: number } => x !== null);
      grouped.set(payor, sortedWithIndex);
    });
    return { payorTabs: tabs, groupedByPayor: grouped };
  }, [master, payorsFromData, sortId]);

  const [selectedPayor, setSelectedPayor] = useState<string>('');
  useEffect(() => {
    if (payorTabs.length > 0) {
      setSelectedPayor((prev) => (payorTabs.includes(prev) ? prev : payorTabs[0]));
    } else {
      setSelectedPayor('');
    }
  }, [payorTabs]);

  const currentList = groupedByPayor.get(selectedPayor) ?? [];
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
    impactFeedback('medium');
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
        <LoadingView message="Loading…" />
      ) : (
        <>
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <SortBar
              title={formatMonthYear(month)}
              sortLabel={currentSortLabel}
              onPressSort={() => setSortModalVisible(true)}
            />
            <PayorTabs
              tabs={payorTabs}
              selectedPayor={selectedPayor}
              onSelect={setSelectedPayor}
              getCount={(payor) => (groupedByPayor.get(payor) ?? []).length}
            />
          </View>
          <FlatList
            data={currentList}
            keyExtractor={(item, i) => `${item.row?.Id ?? i}-${item.sheetRowIndex}-${i}`}
            renderItem={({ item }) => {
              if (!item?.row || item.sheetRowIndex == null) return null;
              return (
                <MasterRowItem
                  row={item.row}
                  sheetRowIndex={item.sheetRowIndex}
                  onEdit={() => handleEdit(item.row, item.sheetRowIndex)}
                  onDelete={() => handleDelete(item.row, item.sheetRowIndex)}
                  isDeleting={deletingId === item.sheetRowIndex}
                />
              );
            }}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {payorTabs.length > 0 && selectedPayor
                  ? `No expenses for ${selectedPayor}. Add one below.`
                  : 'No expenses yet. Add one below.'}
              </Text>
            }
          />
        </>
      )}
      <TouchableOpacity
        style={[styles.fab, styles.fabElevation, { backgroundColor: colors.primary }]}
        onPress={handleAdd}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={icon.md} color={colors.onPrimary} />
        <Text style={[styles.fabText, { color: colors.onPrimary }]}>Add expense</Text>
      </TouchableOpacity>
      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        options={SORT_OPTIONS}
        selectedId={sortId}
        onSelect={(id) => setSort(id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl },
  banner: { padding: space.md, paddingHorizontal: space.base },
  errorText: { ...typography.bodyMedium },
  header: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: space.base, paddingTop: space.base, paddingBottom: contentBottomWithFab },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargetMin + space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    borderRadius: radius.md,
    marginBottom: space.sm,
  },
  rowElevation: { ...elevation.card },
  rowMain: { flex: 1 },
  name: { ...typography.titleMedium },
  meta: { ...typography.bodySmall, marginTop: space.xs },
  deleteSpinner: { marginLeft: space.md },
  emptyText: { textAlign: 'center', paddingVertical: space.xl },
  fab: {
    position: 'absolute',
    bottom: space.xl,
    left: space.base,
    right: space.base,
    flexDirection: 'row',
    paddingVertical: space.base,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 56,
  },
  fabElevation: { ...elevation.overlay },
  fabText: { ...typography.labelLarge, fontWeight: '600' },
});

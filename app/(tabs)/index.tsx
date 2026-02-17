import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSheetId } from '../../contexts/SheetIdContext';
import { useExpenses } from '../../hooks/useExpenses';
import { formatMonthYear } from '../../lib/month';
import { sortMonthly } from '../../lib/sort';
import { space, radius, icon, touchTargetMin, elevation } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { STORAGE_KEYS, type ChecklistSortId } from '../../constants/storage';
import type { MonthlyRow } from '../../lib/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LoadingView } from '../../components/LoadingView';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { SortBar } from '../../components/SortBar';
import { PayorTabs } from '../../components/PayorTabs';
import { SortModal } from '../../components/SortModal';
import { selectionFeedback } from '../../lib/haptics';

type MonthlyWithIndex = { row: MonthlyRow; sheetRowIndex: number };

const SORT_OPTIONS: { id: ChecklistSortId; label: string }[] = [
  { id: 'nameAsc', label: 'Name A–Z' },
  { id: 'nameDesc', label: 'Name Z–A' },
  { id: 'amountDesc', label: 'Amount (high first)' },
  { id: 'paymentMethod', label: 'Payment method' },
  { id: 'paidFirst', label: 'Paid first' },
  { id: 'unpaidFirst', label: 'Unpaid first' },
];

function ExpenseRow({
  row,
  sheetRowIndex,
  paymentMethod,
  onToggle,
  isUpdating,
}: {
  row: MonthlyRow;
  sheetRowIndex: number;
  paymentMethod?: string;
  onToggle: () => void;
  isUpdating: boolean;
}) {
  const { colors } = useTheme();
  const isPaid = (row?.Status ?? '') === 'Paid';
  const metaParts = [paymentMethod, row?.Amount ? `₱${row.Amount}` : ''].filter(Boolean);
  const metaText = metaParts.join(' · ');
  return (
    <TouchableOpacity
      style={[styles.row, styles.rowElevation, { backgroundColor: colors.surface }]}
      onPress={onToggle}
      activeOpacity={0.8}
      disabled={isUpdating}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.primary, backgroundColor: isPaid ? colors.paid : 'transparent' },
          ]}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isPaid ? (
            <MaterialCommunityIcons name="check" size={icon.xs} color={colors.onPrimary} />
          ) : null}
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {row?.ExpenseId ?? ''}
          </Text>
          {metaText ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {metaText}
            </Text>
          ) : null}
        </View>
      </View>
      <Text style={[styles.status, { color: isPaid ? colors.paid : colors.unpaid }]}>
        {row?.Status ?? 'Un-Paid'}
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { sheetId } = useSheetId();
  const { data, loading, error, reload, updateStatus, month, updatingStatusRow } = useExpenses();
  const [sortId, setSortId] = useState<ChecklistSortId>('nameAsc');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.SORT_CHECKLIST).then((stored) => {
      if (stored && SORT_OPTIONS.some((o) => o.id === stored)) setSortId(stored as ChecklistSortId);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (sheetId) reload();
    }, [sheetId, reload])
  );

  const setSort = useCallback((id: ChecklistSortId) => {
    setSortId(id);
    AsyncStorage.setItem(STORAGE_KEYS.SORT_CHECKLIST, id);
    setSortModalVisible(false);
  }, []);

  const { payorTabs, groupedByPayor, masterByName } = useMemo(() => {
    const empty = {
      payorTabs: [] as string[],
      groupedByPayor: new Map<string, MonthlyWithIndex[]>(),
      masterByName: new Map<string, { paymentMethod: string; payor: string }>(),
    };
    try {
      const monthly = data?.monthly ?? [];
      const master = data?.master ?? [];
      const payorsFromData = data?.payors ?? [];

      const nameToMeta = new Map<string, { paymentMethod: string; payor: string }>();
      master.forEach((row) => {
        const name = row?.Name?.trim() ?? '';
        nameToMeta.set(name, {
          paymentMethod: row?.['Payment Method'] ?? '',
          payor: (row?.Payor?.trim() ?? '') || 'Other',
        });
      });

      if (!monthly.length) return { ...empty, masterByName: nameToMeta };

      const withIndex: MonthlyWithIndex[] = [];
      for (let i = 0; i < monthly.length; i++) {
        const row = monthly[i];
        if (row != null) withIndex.push({ row, sheetRowIndex: i + 2 });
      }

      const byPayor = new Map<string, MonthlyWithIndex[]>();
      withIndex.forEach(({ row, sheetRowIndex }) => {
        const payor = nameToMeta.get(row?.ExpenseId?.trim() ?? '')?.payor ?? 'Other';
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

      const paymentMethodByExpenseId = new Map(
        master.map((m) => [m?.Name?.trim() ?? '', m?.['Payment Method'] ?? ''])
      );
      const grouped = new Map<string, MonthlyWithIndex[]>();
      tabOrder.forEach((payor) => {
        const items = byPayor.get(payor) ?? [];
        const sortedRows = sortMonthly(
          items.map((x) => x.row),
          sortId,
          paymentMethodByExpenseId
        );
        const sortedWithIndex: MonthlyWithIndex[] = sortedRows
          .map((row) => {
            const found = items.find((x) => x.row === row);
            return found ? { row: found.row, sheetRowIndex: found.sheetRowIndex } : null;
          })
          .filter((x): x is MonthlyWithIndex => x !== null);
        grouped.set(payor, sortedWithIndex);
      });
      return { payorTabs: tabOrder, groupedByPayor: grouped, masterByName: nameToMeta };
    } catch {
      return empty;
    }
  }, [data?.monthly, data?.master, data?.payors, sortId]);

  const [selectedPayor, setSelectedPayor] = useState<string>('');
  useEffect(() => {
    if (payorTabs.length > 0) {
      setSelectedPayor((prev) => (payorTabs.includes(prev) ? prev : payorTabs[0]));
    } else {
      setSelectedPayor('');
    }
  }, [payorTabs]);

  if (!sheetId) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="cloud-off-outline" size={icon.xxl} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.text, marginTop: space.base }]}>
          Set your Google Sheet ID in Settings to get started.
        </Text>
      </View>
    );
  }

  const handleToggle = (item: MonthlyRow, sheetRowIndex: number) => {
    selectionFeedback();
    const next = item.Status === 'Paid' ? 'Un-Paid' : 'Paid';
    updateStatus(sheetRowIndex, next as 'Paid' | 'Un-Paid');
  };

  if (loading && !data) {
    return <LoadingView message="Loading…" />;
  }

  if (error && !data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={icon.xxl} color={colors.unpaid} />
        <Text style={[styles.errorText, { color: colors.unpaid, marginTop: space.base }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => reload(true)} activeOpacity={0.8}>
          <Text style={[styles.retryText, { color: colors.onPrimary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data?.monthly?.length && data?.master?.length) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No entries for this month yet. Pull to refresh to create them.
        </Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => reload(true)} activeOpacity={0.8}>
          <Text style={[styles.retryText, { color: colors.onPrimary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sortId)?.label ?? 'Sort';
  const currentList = groupedByPayor.get(selectedPayor) ?? [];

  if (data?.monthly?.length && payorTabs.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Unable to group items. Pull to refresh or try again.
        </Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => reload(true)} activeOpacity={0.8}>
          <Text style={[styles.retryText, { color: colors.onPrimary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const listData = Array.isArray(currentList) ? currentList : [];

  return (
    <ErrorBoundary onReset={() => reload(true)}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          {error ? (
            <View style={styles.inlineErrorWrap}>
              <Text style={[styles.inlineError, { color: colors.unpaid }]}>{error}</Text>
            </View>
          ) : null}
        </View>
      <FlatList
        data={listData}
        keyExtractor={(item, i) => `row-${item.sheetRowIndex}-${i}`}
        renderItem={({ item }) => {
          if (!item?.row || item.sheetRowIndex == null) return null;
          const row = item.row as MonthlyRow;
          return (
            <ExpenseRow
              row={row}
              sheetRowIndex={item.sheetRowIndex}
              paymentMethod={masterByName.get(String(row.ExpenseId ?? '').trim())?.paymentMethod}
              onToggle={() => handleToggle(row, item.sheetRowIndex)}
              isUpdating={updatingStatusRow === item.sheetRowIndex}
            />
          );
        }}
        contentContainerStyle={styles.list}
        onRefresh={() => reload(true)}
        refreshing={loading}
        ListEmptyComponent={
          payorTabs.length > 0 && selectedPayor ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No items for {selectedPayor}.
            </Text>
          ) : null
        }
      />
      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        options={SORT_OPTIONS}
        selectedId={sortId}
        onSelect={(id) => setSort(id)}
      />
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl },
  header: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inlineErrorWrap: { paddingHorizontal: space.base, paddingTop: space.xs },
  inlineError: { ...typography.bodySmall },
  list: { padding: space.base, paddingTop: space.base, paddingBottom: space.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargetMin + space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    borderRadius: radius.md,
    marginBottom: space.sm,
  },
  rowElevation: { ...elevation.card },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minHeight: touchTargetMin },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    borderWidth: 2,
    marginRight: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, justifyContent: 'center' },
  name: { ...typography.titleMedium, fontWeight: '500' },
  meta: { ...typography.bodySmall, marginTop: space.xxs },
  status: { ...typography.bodyMedium, fontWeight: '600' },
  errorText: { textAlign: 'center', marginBottom: space.base },
  emptyText: { textAlign: 'center', marginBottom: space.base, paddingVertical: space.xl },
  retryBtn: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    minHeight: touchTargetMin,
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  retryText: { ...typography.labelLarge, fontWeight: '600' },
});

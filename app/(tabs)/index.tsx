import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSheetId } from '../../contexts/SheetIdContext';
import { useExpenses } from '../../hooks/useExpenses';
import { formatMonthYear } from '../../lib/month';
import { sortMonthly } from '../../lib/sort';
import { spacing, borderRadius, iconSize } from '../../constants/layout';
import { STORAGE_KEYS, type ChecklistSortId } from '../../constants/storage';
import type { MonthlyRow } from '../../lib/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const isPaid = row.Status === 'Paid';
  const metaParts = [paymentMethod, row.Amount ? `₱${row.Amount}` : ''].filter(Boolean);
  const metaText = metaParts.join(' · ');
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onToggle}
      activeOpacity={0.7}
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
            <MaterialCommunityIcons name="check" size={16} color="#fff" />
          ) : null}
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {row.ExpenseId}
          </Text>
          {metaText ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {metaText}
            </Text>
          ) : null}
        </View>
      </View>
      <Text style={[styles.status, { color: isPaid ? colors.paid : colors.unpaid }]}>
        {row.Status}
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

  if (!sheetId) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="cloud-off-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.text, marginTop: spacing.base }]}>
          Set your Google Sheet ID in Settings to get started.
        </Text>
      </View>
    );
  }

  const handleToggle = (item: MonthlyRow, index: number) => {
    const sheetRowIndex = index + 2;
    const next = item.Status === 'Paid' ? 'Un-Paid' : 'Paid';
    updateStatus(sheetRowIndex, next as 'Paid' | 'Un-Paid');
  };

  if (loading && !data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.unpaid} />
        <Text style={[styles.errorText, { color: colors.unpaid, marginTop: spacing.base }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={reload}>
          <Text style={styles.retryText}>Retry</Text>
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
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={reload}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const masterByName = new Map(
    (data?.master ?? []).map((m) => [m.Name?.trim() ?? '', m['Payment Method'] ?? ''])
  );
  const sortedMonthly = sortMonthly(data?.monthly ?? [], sortId, masterByName);
  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sortId)?.label ?? 'Sort';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.monthTitle, { color: colors.text }]}>{formatMonthYear(month)}</Text>
          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setSortModalVisible(true)}
          >
            <MaterialCommunityIcons name="sort" size={iconSize.sm} color={colors.primary} />
            <Text style={[styles.sortBtnText, { color: colors.primary }]}>{currentSortLabel}</Text>
          </TouchableOpacity>
        </View>
        {error && (
          <Text style={[styles.inlineError, { color: colors.unpaid }]}>{error}</Text>
        )}
      </View>
      <FlatList
        data={sortedMonthly}
        keyExtractor={(item, i) => `${item.ExpenseId}-${i}`}
        renderItem={({ item, index }) => {
          const sheetRowIndex = (data?.monthly ?? []).indexOf(item) + 2;
          return (
            <ExpenseRow
              row={item}
              sheetRowIndex={sheetRowIndex}
              paymentMethod={masterByName.get(item.ExpenseId?.trim() ?? '')}
              onToggle={() => handleToggle(item, (data?.monthly ?? []).indexOf(item))}
              isUpdating={updatingStatusRow === sheetRowIndex}
            />
          );
        }}
        contentContainerStyle={styles.list}
        onRefresh={reload}
        refreshing={loading}
      />
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
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { fontSize: 20, fontWeight: '600' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1 },
  sortBtnText: { fontSize: 13, fontWeight: '500' },
  inlineError: { fontSize: 12, marginTop: spacing.xs },
  list: { padding: spacing.base, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500' },
  meta: { fontSize: 12, marginTop: 2 },
  status: { fontSize: 14, fontWeight: '600' },
  loadingText: { marginTop: spacing.sm },
  errorText: { textAlign: 'center', marginBottom: spacing.base },
  emptyText: { textAlign: 'center', marginBottom: spacing.base },
  retryBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.sm },
  retryText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalContent: { width: '100%', maxWidth: 320, borderRadius: borderRadius.md, padding: spacing.base },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.sm },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: borderRadius.sm },
  modalOptionText: { fontSize: 16 },
});

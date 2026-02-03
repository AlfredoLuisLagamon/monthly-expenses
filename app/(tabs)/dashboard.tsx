import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSheetId } from '../../contexts/SheetIdContext';
import { useExpenses } from '../../hooks/useExpenses';
import { getDashboardSummary } from '../../lib/dashboard';
import { formatMonthYear } from '../../lib/month';
import { spacing, borderRadius, iconSize } from '../../constants/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { sheetId } = useSheetId();
  const { data, loading, reload } = useExpenses();
  const summary = getDashboardSummary(data ?? null);

  useFocusEffect(
    useCallback(() => {
      if (sheetId) reload();
    }, [sheetId, reload])
  );

  if (!sheetId) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Set your Google Sheet ID in Settings to get started.
        </Text>
      </View>
    );
  }

  if (loading && !data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="chart-box-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: spacing.base }]}>
          No data for {data?.month ? formatMonthYear(data.month) : 'this month'} yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
        {data?.month ? formatMonthYear(data.month) : ''}
      </Text>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: colors.paid + '18', borderColor: colors.paid + '40' }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={iconSize.lg} color={colors.paid} />
          <Text style={[styles.cardValue, { color: colors.text }]}>
            ₱{summary.totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            Paid ({summary.paidCount})
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.unpaid + '18', borderColor: colors.unpaid + '40' }]}>
          <MaterialCommunityIcons name="clock-outline" size={iconSize.lg} color={colors.unpaid} />
          <Text style={[styles.cardValue, { color: colors.text }]}>
            ₱{summary.totalUnpaid.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            Unpaid ({summary.unpaidCount})
          </Text>
        </View>
      </View>

      <View style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="currency-usd" size={iconSize.md} color={colors.primary} />
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total this month</Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>
          ₱{summary.totalAll.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>By payment method</Text>
      {summary.byPaymentMethod.map((row) => (
        <View
          key={row.method}
          style={[styles.methodRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.methodName, { color: colors.text }]}>{row.method}</Text>
          <View style={styles.methodStats}>
            <Text style={[styles.methodStat, { color: colors.paid }]}>
              Paid ₱{row.paidAmount.toLocaleString('en-PH', { maximumFractionDigits: 0 })} ({row.paidCount})
            </Text>
            <Text style={[styles.methodStat, { color: colors.unpaid }]}>
              Unpaid ₱{row.unpaidAmount.toLocaleString('en-PH', { maximumFractionDigits: 0 })} ({row.unpaidCount})
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { textAlign: 'center' },
  monthLabel: { fontSize: 14, marginBottom: spacing.sm },
  cardsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  card: {
    flex: 1,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardValue: { fontSize: 18, fontWeight: '700', marginTop: spacing.xs },
  cardLabel: { fontSize: 12, marginTop: spacing.xs },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  totalLabel: { flex: 1, fontSize: 14 },
  totalValue: { fontSize: 20, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
  methodRow: {
    padding: spacing.base,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  methodName: { fontSize: 16, fontWeight: '600', marginBottom: spacing.xs },
  methodStats: { gap: spacing.xs },
  methodStat: { fontSize: 13 },
});

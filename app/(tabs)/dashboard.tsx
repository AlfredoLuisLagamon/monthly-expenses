import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSheetId } from '../../contexts/SheetIdContext';
import { useExpenses } from '../../hooks/useExpenses';
import { getDashboardSummary } from '../../lib/dashboard';
import { formatMonthYear } from '../../lib/month';
import { space, radius, icon, elevation } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LoadingView } from '../../components/LoadingView';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const paidCardBg = colors.paid + (isDark ? '26' : '18');
  const unpaidCardBg = colors.unpaid + (isDark ? '26' : '18');
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
    return <LoadingView message="Loading…" />;
  }

  if (!summary) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="chart-box-outline" size={icon.xxl} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: space.base }]}>
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
        <View style={[styles.summaryCard, styles.cardElevation, { backgroundColor: paidCardBg, borderLeftColor: colors.paid, borderLeftWidth: 4 }]}>
          <MaterialCommunityIcons name="check-circle" size={icon.lg} color={colors.paid} />
          <Text style={[styles.cardValue, { color: colors.paid }]}>
            ₱{summary.totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            Paid ({summary.paidCount})
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.cardElevation, { backgroundColor: unpaidCardBg, borderLeftColor: colors.unpaid, borderLeftWidth: 4 }]}>
          <MaterialCommunityIcons name="clock-outline" size={icon.lg} color={colors.unpaid} />
          <Text style={[styles.cardValue, { color: colors.unpaid }]}>
            ₱{summary.totalUnpaid.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            Unpaid ({summary.unpaidCount})
          </Text>
        </View>
      </View>

      <View style={[styles.totalCard, styles.totalCardElevation, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="currency-usd" size={icon.lg} color={colors.primary} />
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total this month</Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>
          ₱{summary.totalAll.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>By payor</Text>
      {summary.byPayor.map((payorSummary) => (
        <View
          key={payorSummary.payor}
          style={[styles.payorCard, styles.payorCardElevation, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.payorName, { color: colors.text }]}>{payorSummary.payor}</Text>
          <View style={[styles.payorTotalsCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.methodStat, { color: colors.paid }]}>
              Paid ₱{payorSummary.paidAmount.toLocaleString('en-PH', { maximumFractionDigits: 0 })} ({payorSummary.paidCount})
            </Text>
            <Text style={[styles.methodStat, { color: colors.unpaid }]}>
              Unpaid ₱{payorSummary.unpaidAmount.toLocaleString('en-PH', { maximumFractionDigits: 0 })} ({payorSummary.unpaidCount})
            </Text>
          </View>
          <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>By payment method</Text>
          {payorSummary.byPaymentMethod.map((row) => (
            <View
              key={row.method}
              style={[styles.methodCard, styles.methodCardElevation, { backgroundColor: colors.background }]}
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
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: space.base, paddingBottom: space.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl },
  emptyText: { textAlign: 'center', ...typography.bodyMedium },
  monthLabel: { ...typography.labelLarge, marginBottom: space.base, letterSpacing: 0.2 },
  cardsRow: { flexDirection: 'row', gap: space.base, marginBottom: space.base },
  summaryCard: {
    flex: 1,
    padding: space.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  cardElevation: { ...elevation.card },
  cardValue: { ...typography.headline, fontSize: 20, fontWeight: '700', marginTop: space.sm },
  cardLabel: { ...typography.labelMedium, marginTop: space.xs },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.xl,
    borderRadius: radius.lg,
    marginBottom: space.xl,
    gap: space.base,
  },
  totalCardElevation: { ...elevation.card },
  totalLabel: { flex: 1, ...typography.bodyLarge },
  totalValue: { ...typography.headline, fontSize: 22, fontWeight: '700' },
  sectionTitle: { ...typography.titleMedium, marginBottom: space.base },
  payorCard: {
    padding: space.xl,
    borderRadius: radius.lg,
    marginBottom: space.base,
  },
  payorCardElevation: { ...elevation.card },
  payorName: { ...typography.titleLarge, marginBottom: space.sm },
  payorTotalsCard: {
    flexDirection: 'row',
    gap: space.base,
    padding: space.md,
    borderRadius: radius.sm,
    marginBottom: space.base,
  },
  subsectionTitle: { ...typography.labelLarge, marginBottom: space.sm, marginTop: space.xs },
  methodCard: {
    padding: space.base,
    borderRadius: radius.sm,
    marginBottom: space.sm,
  },
  methodCardElevation: { ...elevation.card },
  methodName: { ...typography.titleMedium, marginBottom: space.xxs },
  methodStats: { gap: space.xs },
  methodStat: { ...typography.bodyMedium },
});

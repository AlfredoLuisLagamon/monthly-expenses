import type { ExpenseData } from '../hooks/useExpenses';
import type { MonthlyRow, MasterRow } from './api';

export type PaymentMethodSummary = {
  method: string;
  paidCount: number;
  unpaidCount: number;
  paidAmount: number;
  unpaidAmount: number;
  totalAmount: number;
};

export type DashboardSummary = {
  totalPaid: number;
  totalUnpaid: number;
  totalAll: number;
  paidCount: number;
  unpaidCount: number;
  byPaymentMethod: PaymentMethodSummary[];
};

function parseAmount(a: string): number {
  const n = parseFloat(String(a).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Join monthly rows with master to get payment method; aggregate for dashboard */
export function getDashboardSummary(data: ExpenseData | null): DashboardSummary | null {
  if (!data?.monthly?.length) return null;
  const masterByName = new Map<string, MasterRow>();
  data.master.forEach((m) => masterByName.set(m.Name?.trim() ?? '', m));

  let totalPaid = 0;
  let totalUnpaid = 0;
  const byMethod = new Map<
    string,
    { paidCount: number; unpaidCount: number; paidAmount: number; unpaidAmount: number }
  >();

  data.monthly.forEach((row: MonthlyRow) => {
    const amount = parseAmount(row.Amount ?? '0');
    const method = masterByName.get(row.ExpenseId?.trim() ?? '')?.['Payment Method'] ?? 'Other';
    if (!byMethod.has(method)) {
      byMethod.set(method, { paidCount: 0, unpaidCount: 0, paidAmount: 0, unpaidAmount: 0 });
    }
    const rec = byMethod.get(method)!;
    if (row.Status === 'Paid') {
      rec.paidCount += 1;
      rec.paidAmount += amount;
      totalPaid += amount;
    } else {
      rec.unpaidCount += 1;
      rec.unpaidAmount += amount;
      totalUnpaid += amount;
    }
  });

  const byPaymentMethod: PaymentMethodSummary[] = Array.from(byMethod.entries()).map(
    ([method, rec]) => ({
      method,
      paidCount: rec.paidCount,
      unpaidCount: rec.unpaidCount,
      paidAmount: rec.paidAmount,
      unpaidAmount: rec.unpaidAmount,
      totalAmount: rec.paidAmount + rec.unpaidAmount,
    })
  );

  const paidCount = data.monthly.filter((r) => r.Status === 'Paid').length;
  const unpaidCount = data.monthly.filter((r) => r.Status === 'Un-Paid').length;

  return {
    totalPaid,
    totalUnpaid,
    totalAll: totalPaid + totalUnpaid,
    paidCount,
    unpaidCount,
    byPaymentMethod: byPaymentMethod.sort((a, b) => b.totalAmount - a.totalAmount),
  };
}

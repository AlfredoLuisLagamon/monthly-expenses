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

export type PayorSummary = {
  payor: string;
  paidCount: number;
  unpaidCount: number;
  paidAmount: number;
  unpaidAmount: number;
  totalAmount: number;
  byPaymentMethod: PaymentMethodSummary[];
};

export type DashboardSummary = {
  totalPaid: number;
  totalUnpaid: number;
  totalAll: number;
  paidCount: number;
  unpaidCount: number;
  byPaymentMethod: PaymentMethodSummary[];
  byPayor: PayorSummary[];
};

function parseAmount(a: string): number {
  const n = parseFloat(String(a).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function toPaymentMethodList(
  byMethod: Map<string, { paidCount: number; unpaidCount: number; paidAmount: number; unpaidAmount: number }>
): PaymentMethodSummary[] {
  return Array.from(byMethod.entries())
    .map(([method, rec]) => ({
      method,
      paidCount: rec.paidCount,
      unpaidCount: rec.unpaidCount,
      paidAmount: rec.paidAmount,
      unpaidAmount: rec.unpaidAmount,
      totalAmount: rec.paidAmount + rec.unpaidAmount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/** Join monthly rows with master to get payor and payment method; aggregate for dashboard */
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
  const byPayorMap = new Map<
    string,
    {
      paidCount: number;
      unpaidCount: number;
      paidAmount: number;
      unpaidAmount: number;
      byMethod: Map<
        string,
        { paidCount: number; unpaidCount: number; paidAmount: number; unpaidAmount: number }
      >;
    }
  >();

  data.monthly.forEach((row: MonthlyRow) => {
    const amount = parseAmount(row.Amount ?? '0');
    const master = masterByName.get(row.ExpenseId?.trim() ?? '');
    const method = master?.['Payment Method'] ?? 'Other';
    const payor = (master?.Payor?.trim() ?? '') || 'Other';

    if (!byMethod.has(method)) {
      byMethod.set(method, { paidCount: 0, unpaidCount: 0, paidAmount: 0, unpaidAmount: 0 });
    }
    const methodRec = byMethod.get(method)!;

    if (!byPayorMap.has(payor)) {
      byPayorMap.set(payor, {
        paidCount: 0,
        unpaidCount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        byMethod: new Map(),
      });
    }
    const payorRec = byPayorMap.get(payor)!;
    if (!payorRec.byMethod.has(method)) {
      payorRec.byMethod.set(method, {
        paidCount: 0,
        unpaidCount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
      });
    }
    const payorMethodRec = payorRec.byMethod.get(method)!;

    if (row.Status === 'Paid') {
      methodRec.paidCount += 1;
      methodRec.paidAmount += amount;
      payorRec.paidCount += 1;
      payorRec.paidAmount += amount;
      payorMethodRec.paidCount += 1;
      payorMethodRec.paidAmount += amount;
      totalPaid += amount;
    } else {
      methodRec.unpaidCount += 1;
      methodRec.unpaidAmount += amount;
      payorRec.unpaidCount += 1;
      payorRec.unpaidAmount += amount;
      payorMethodRec.unpaidCount += 1;
      payorMethodRec.unpaidAmount += amount;
      totalUnpaid += amount;
    }
  });

  const byPaymentMethod = toPaymentMethodList(byMethod);
  const byPayor: PayorSummary[] = Array.from(byPayorMap.entries())
    .map(([payor, rec]) => ({
      payor,
      paidCount: rec.paidCount,
      unpaidCount: rec.unpaidCount,
      paidAmount: rec.paidAmount,
      unpaidAmount: rec.unpaidAmount,
      totalAmount: rec.paidAmount + rec.unpaidAmount,
      byPaymentMethod: toPaymentMethodList(rec.byMethod),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const paidCount = data.monthly.filter((r) => r.Status === 'Paid').length;
  const unpaidCount = data.monthly.filter((r) => r.Status === 'Un-Paid').length;

  return {
    totalPaid,
    totalUnpaid,
    totalAll: totalPaid + totalUnpaid,
    paidCount,
    unpaidCount,
    byPaymentMethod,
    byPayor,
  };
}

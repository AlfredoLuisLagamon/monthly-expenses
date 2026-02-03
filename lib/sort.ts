import type { MonthlyRow } from './api';
import type { MasterRow } from './api';
import type { ChecklistSortId, ExpensesSortId } from '../constants/storage';

/** Optional map: expense name (ExpenseId) -> payment method (for paymentMethod sort) */
export function sortMonthly(
  rows: MonthlyRow[],
  sortId: ChecklistSortId,
  paymentMethodByExpenseId?: Map<string, string>
): MonthlyRow[] {
  const arr = [...rows];
  const getPaymentMethod = (expenseId: string) =>
    paymentMethodByExpenseId?.get(expenseId?.trim() ?? '') ?? '';
  switch (sortId) {
    case 'nameAsc':
      return arr.sort((a, b) => (a.ExpenseId ?? '').localeCompare(b.ExpenseId ?? ''));
    case 'nameDesc':
      return arr.sort((a, b) => (b.ExpenseId ?? '').localeCompare(a.ExpenseId ?? ''));
    case 'amountDesc':
      return arr.sort((a, b) => parseFloat(b.Amount || '0') - parseFloat(a.Amount || '0'));
    case 'paidFirst':
      return arr.sort((a, b) => (a.Status === 'Paid' ? -1 : b.Status === 'Paid' ? 1 : 0));
    case 'unpaidFirst':
      return arr.sort((a, b) => (a.Status === 'Un-Paid' ? -1 : b.Status === 'Un-Paid' ? 1 : 0));
    case 'paymentMethod':
      return arr.sort((a, b) =>
        getPaymentMethod(a.ExpenseId ?? '').localeCompare(getPaymentMethod(b.ExpenseId ?? ''))
      );
    default:
      return arr;
  }
}

export function sortMaster(rows: MasterRow[], sortId: ExpensesSortId): MasterRow[] {
  const arr = [...rows];
  switch (sortId) {
    case 'nameAsc':
      return arr.sort((a, b) => (a.Name ?? '').localeCompare(b.Name ?? ''));
    case 'nameDesc':
      return arr.sort((a, b) => (b.Name ?? '').localeCompare(a.Name ?? ''));
    case 'amountAsc':
      return arr.sort((a, b) => parseFloat(a.Amount || '0') - parseFloat(b.Amount || '0'));
    case 'amountDesc':
      return arr.sort((a, b) => parseFloat(b.Amount || '0') - parseFloat(a.Amount || '0'));
    case 'paymentMethod':
      return arr.sort((a, b) =>
        (a['Payment Method'] ?? '').localeCompare(b['Payment Method'] ?? '')
      );
    default:
      return arr;
  }
}

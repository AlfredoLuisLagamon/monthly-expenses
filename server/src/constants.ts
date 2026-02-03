/** Sheet tab names - must match user's workbook */
export const SHEET_NAMES = {
  MASTER: 'Master',
  MONTHLY: 'Monthly',
  PAYMENT_METHODS: 'PaymentMethods',
  PAYORS: 'Payors',
} as const;

/** Column headers (row 1) - used for validation and mapping */
export const MASTER_HEADERS = ['Id', 'Name', 'Payment Method', 'Payor', 'Amount', 'Order'];
export const MONTHLY_HEADERS = ['MonthYear', 'ExpenseId', 'Status', 'Amount'];
export const OPTION_HEADERS = ['Name'];

export const REQUIRED_SHEETS = [
  SHEET_NAMES.MASTER,
  SHEET_NAMES.MONTHLY,
  SHEET_NAMES.PAYMENT_METHODS,
  SHEET_NAMES.PAYORS,
] as const;

export const STATUS_PAID = 'Paid';
export const STATUS_UNPAID = 'Un-Paid';

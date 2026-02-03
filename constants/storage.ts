export const STORAGE_KEYS = {
  SHEET_ID: '@monthly_expenses/sheet_id',
  THEME: '@monthly_expenses/theme',
  CACHE_DATA: '@monthly_expenses/cache_data',
  CACHE_MONTH: '@monthly_expenses/cache_month',
  SORT_CHECKLIST: '@monthly_expenses/sort_checklist',
  SORT_EXPENSES: '@monthly_expenses/sort_expenses',
} as const;

export type ChecklistSortId = 'nameAsc' | 'nameDesc' | 'amountDesc' | 'paidFirst' | 'unpaidFirst' | 'paymentMethod';
export type ExpensesSortId = 'nameAsc' | 'nameDesc' | 'amountAsc' | 'amountDesc' | 'paymentMethod';

export const THEME_PRESETS = [
  { id: 'blue', label: 'Blue', primary: '#2563eb', surface: '#eff6ff' },
  { id: 'green', label: 'Green', primary: '#059669', surface: '#ecfdf5' },
  { id: 'purple', label: 'Purple', primary: '#7c3aed', surface: '#f5f3ff' },
  { id: 'dark', label: 'Dark', primary: '#818cf8', surface: '#1e1b4b' },
  { id: 'black', label: 'Black', primary: '#a78bfa', surface: '#0a0a0a' },
] as const;

export type ThemeId = (typeof THEME_PRESETS)[number]['id'];

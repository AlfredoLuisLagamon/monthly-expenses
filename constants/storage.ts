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

export type ThemeMode = 'light' | 'dark' | 'oled';

export const THEME_PRESETS = [
  { id: 'blue', label: 'Blue', mode: 'light' as ThemeMode, primary: '#7dd3fc' },
  { id: 'blueDark', label: 'Blue (Dark)', mode: 'dark' as ThemeMode, primary: '#93c5fd' },
  { id: 'blueOled', label: 'Blue (OLED)', mode: 'oled' as ThemeMode, primary: '#93c5fd' },
  { id: 'green', label: 'Green', mode: 'light' as ThemeMode, primary: '#6ee7b7' },
  { id: 'greenDark', label: 'Green (Dark)', mode: 'dark' as ThemeMode, primary: '#5eead4' },
  { id: 'greenOled', label: 'Green (OLED)', mode: 'oled' as ThemeMode, primary: '#5eead4' },
  { id: 'purple', label: 'Purple', mode: 'light' as ThemeMode, primary: '#c4b5fd' },
  { id: 'purpleDark', label: 'Purple (Dark)', mode: 'dark' as ThemeMode, primary: '#a78bfa' },
  { id: 'purpleOled', label: 'Purple (OLED)', mode: 'oled' as ThemeMode, primary: '#a78bfa' },
] as const;

export type ThemeId = (typeof THEME_PRESETS)[number]['id'];

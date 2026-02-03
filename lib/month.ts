/** Current month as YYYY-MM */
export function getCurrentMonthYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Format YYYY-MM to "Month YYYY" e.g. "February 2025" */
export function formatMonthYear(monthYear: string): string {
  const [y, m] = monthYear.split('-');
  const monthIndex = parseInt(m ?? '1', 10) - 1;
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${names[monthIndex] ?? monthYear} ${y ?? ''}`;
}

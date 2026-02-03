/**
 * Extract Google Sheet ID from URL or return as-is if it looks like an ID.
 * IDs are 44 chars alphanumeric with hyphens.
 */
export function extractSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{30,}$/.test(trimmed)) return trimmed;
  return trimmed;
}

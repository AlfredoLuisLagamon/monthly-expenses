import type { Request, Response } from 'express';
import {
  getSheetsClient,
  validateWorkbook,
  readSheet,
  appendRows,
  updateRow,
  deleteRow,
  ensureMonth,
  ensureMonthFromData,
} from './sheets.js';
import {
  SHEET_NAMES,
  MASTER_HEADERS,
  MONTHLY_HEADERS,
  STATUS_PAID,
  STATUS_UNPAID,
} from './constants.js';

const DATA_CACHE_TTL_MS = 120 * 1000;
const dataCache = new Map<string, { payload: Record<string, unknown>; expires: number }>();

type SheetsApi = ReturnType<typeof getSheetsClient>;

function isRateLimitError(err: unknown): boolean {
  const e = err as { response?: { status?: number }; code?: number };
  return e?.response?.status === 429 || e?.code === 429;
}

function invalidateDataCache(sheetId: string, monthOptional?: string): void {
  if (monthOptional != null) {
    dataCache.delete(`${sheetId}:${monthOptional}`);
  } else {
    for (const k of dataCache.keys()) {
      if (k.startsWith(`${sheetId}:`)) dataCache.delete(k);
    }
  }
}

function getSheets(req: Request): SheetsApi | null {
  const creds = (req as Request & { credentials?: string }).credentials;
  if (!creds) return null;
  return getSheetsClient(creds);
}

function getSheetId(req: Request): string | null {
  const id = (req.query.sheetId as string) ?? (req.body?.sheetId as string);
  return id?.trim() || null;
}

function getMonth(req: Request): string | null {
  const month = (req.query.month as string) ?? (req.body?.month as string);
  return month?.trim() || null;
}

/** GET /api/data?sheetId=xxx&month=YYYY-MM */
export async function getData(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const month = getMonth(req);
  if (!sheets || !sheetId) {
    res.status(400).json({ error: 'Missing sheetId' });
    return;
  }
  if (!month) {
    res.status(400).json({ error: 'Missing month (YYYY-MM)' });
    return;
  }

  const cacheKey = `${sheetId}:${month}`;
  const cached = dataCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    res.json(cached.payload);
    return;
  }

  try {
    const [masterData, monthlyData, paymentMethodsData, payorsData] = await Promise.all([
      readSheet(sheets, sheetId, SHEET_NAMES.MASTER, MASTER_HEADERS.length),
      readSheet(sheets, sheetId, SHEET_NAMES.MONTHLY, MONTHLY_HEADERS.length),
      readSheet(sheets, sheetId, SHEET_NAMES.PAYMENT_METHODS, 1),
      readSheet(sheets, sheetId, SHEET_NAMES.PAYORS, 1),
    ]);

    const { appended, newRows } = ensureMonthFromData(month, masterData, monthlyData);
    if (newRows.length > 0) {
      await appendRows(sheets, sheetId, SHEET_NAMES.MONTHLY, newRows);
    }
    const header =
      monthlyData?.[0] ?? (['MonthYear', 'ExpenseId', 'Status', 'Amount'] as string[]);
    const monthlyRowsMerged = [header].concat((monthlyData ?? []).slice(1), newRows);
    const monthlyAll = rowsToObjects(monthlyRowsMerged, MONTHLY_HEADERS);
    const monthly = monthlyAll.filter((r: Record<string, string>) => r.MonthYear === month);
    const master = rowsToObjects(masterData, MASTER_HEADERS);

    const paymentMethods = (paymentMethodsData.slice(1) ?? [])
      .map((row) => (row[0] ?? '').toString().trim())
      .filter(Boolean);
    const payors = (payorsData.slice(1) ?? [])
      .map((row) => (row[0] ?? '').toString().trim())
      .filter(Boolean);

    const payload = { master, monthly, paymentMethods, payors };
    dataCache.set(cacheKey, { payload, expires: Date.now() + DATA_CACHE_TTL_MS });
    res.json(payload);
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('getData', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to read sheet' });
  }
}

function rowsToObjects(rows: string[][], headers: string[]): Record<string, string>[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? '').toString().trim();
    });
    return obj;
  });
}

/** POST /api/ensure-month body: { sheetId, month } */
export async function postEnsureMonth(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const month = getMonth(req);
  if (!sheets || !sheetId || !month) {
    res.status(400).json({ error: 'Missing sheetId or month' });
    return;
  }
  try {
    const appended = await ensureMonth(sheets, sheetId, month);
    res.json({ appended });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('ensureMonth', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to ensure month' });
  }
}

/** PATCH /api/monthly/status body: { sheetId, month, rowIndex, status } - rowIndex is sheet row (2-based) */
export async function patchMonthlyStatus(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const { month, rowIndex, status } = req.body ?? {};
  if (!sheets || !sheetId || !month || rowIndex == null) {
    res.status(400).json({ error: 'Missing sheetId, month, or rowIndex' });
    return;
  }
  const s = String(status).trim();
  if (s !== STATUS_PAID && s !== STATUS_UNPAID) {
    res.status(400).json({ error: 'status must be Paid or Un-Paid' });
    return;
  }
  const row = Number(rowIndex);
  if (!Number.isInteger(row) || row < 2) {
    res.status(400).json({ error: 'rowIndex must be integer >= 2' });
    return;
  }
  try {
    await updateMonthlyStatusCell(sheets, sheetId, row, s);
    invalidateDataCache(sheetId, month);
    res.json({ ok: true });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('patchMonthlyStatus', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update status' });
  }
}

/** We need to update only the Status column; updateRow overwrites full row. So we need to read the row first, then update. */
async function updateMonthlyStatusCell(
  sheets: SheetsApi,
  spreadsheetId: string,
  rowIndex: number,
  status: string
) {
  const range = `'${SHEET_NAMES.MONTHLY}'!A${rowIndex}:D${rowIndex}`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const row = (res.data.values ?? [])[0] ?? [];
  const monthYear = (row[0] ?? '').toString();
  const expenseId = (row[1] ?? '').toString();
  const amount = (row[3] ?? '').toString();
  await updateRow(sheets, spreadsheetId, SHEET_NAMES.MONTHLY, rowIndex, [monthYear, expenseId, status, amount], MONTHLY_HEADERS.length);
}

/** GET /api/validate?sheetId=xxx */
export async function getValidate(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  if (!sheets || !sheetId) {
    res.status(400).json({ valid: false, error: 'Missing sheetId' });
    return;
  }
  try {
    const result = await validateWorkbook(sheets, sheetId);
    res.json(result);
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({ valid: false, error: 'Too many requests. Please try again in a minute.' });
      return;
    }
    console.error('validate', err);
    res.status(500).json({ valid: false, error: err instanceof Error ? err.message : 'Validation failed' });
  }
}

/** POST /api/master body: { sheetId, row: { Id?, Name, Payment Method, Payor, Amount, Order? } } */
export async function postMaster(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const row = req.body?.row as Record<string, string> | undefined;
  if (!sheets || !sheetId || !row) {
    res.status(400).json({ error: 'Missing sheetId or row' });
    return;
  }
  const id = row.Id?.trim() || `id-${Date.now()}`;
  const name = (row.Name ?? '').toString().trim();
  const paymentMethod = (row['Payment Method'] ?? '').toString().trim();
  const payor = (row.Payor ?? '').toString().trim();
  const amount = (row.Amount ?? '').toString().trim();
  const order = (row.Order ?? '').toString().trim();
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  try {
    await appendRows(sheets, sheetId, SHEET_NAMES.MASTER, [[id, name, paymentMethod, payor, amount, order]]);
    invalidateDataCache(sheetId);
    res.json({ ok: true });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('postMaster', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to add expense' });
  }
}

/** PUT /api/master/:rowIndex body: { sheetId, row } - rowIndex is sheet row (2-based) */
export async function putMaster(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const rowIndex = Number(req.params.rowIndex);
  const row = req.body?.row as Record<string, string> | undefined;
  if (!sheets || !sheetId || !row || !Number.isInteger(rowIndex) || rowIndex < 2) {
    res.status(400).json({ error: 'Missing sheetId/row or invalid rowIndex' });
    return;
  }
  const id = (row.Id ?? '').toString().trim();
  const name = (row.Name ?? '').toString().trim();
  const paymentMethod = (row['Payment Method'] ?? '').toString().trim();
  const payor = (row.Payor ?? '').toString().trim();
  const amount = (row.Amount ?? '').toString().trim();
  const order = (row.Order ?? '').toString().trim();
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  try {
    await updateRow(sheets, sheetId, SHEET_NAMES.MASTER, rowIndex, [id, name, paymentMethod, payor, amount, order], MASTER_HEADERS.length);
    invalidateDataCache(sheetId);
    res.json({ ok: true });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('putMaster', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update expense' });
  }
}

/** DELETE /api/master/:rowIndex?sheetId=xxx */
export async function deleteMaster(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const rowIndex = Number(req.params.rowIndex);
  if (!sheets || !sheetId || !Number.isInteger(rowIndex) || rowIndex < 2) {
    res.status(400).json({ error: 'Missing sheetId or invalid rowIndex' });
    return;
  }
  try {
    await deleteRow(sheets, sheetId, SHEET_NAMES.MASTER, rowIndex);
    invalidateDataCache(sheetId);
    res.json({ ok: true });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('deleteMaster', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete expense' });
  }
}

/** POST /api/options/payment-methods body: { sheetId, name } */
export async function postPaymentMethod(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const name = (req.body?.name ?? '').toString().trim();
  if (!sheets || !sheetId || !name) {
    res.status(400).json({ error: 'Missing sheetId or name' });
    return;
  }
  try {
    await appendRows(sheets, sheetId, SHEET_NAMES.PAYMENT_METHODS, [[name]]);
    res.json({ ok: true });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('postPaymentMethod', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to add option' });
  }
}

/** POST /api/options/payors body: { sheetId, name } */
export async function postPayor(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const name = (req.body?.name ?? '').toString().trim();
  if (!sheets || !sheetId || !name) {
    res.status(400).json({ error: 'Missing sheetId or name' });
    return;
  }
  try {
    await appendRows(sheets, sheetId, SHEET_NAMES.PAYORS, [[name]]);
    res.json({ ok: true });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('postPayor', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to add option' });
  }
}

/** DELETE /api/options/payment-methods/:rowIndex?sheetId=xxx - rowIndex is sheet row (2-based) */
export async function deletePaymentMethod(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const rowIndex = Number(req.params.rowIndex);
  if (!sheets || !sheetId || !Number.isInteger(rowIndex) || rowIndex < 2) {
    res.status(400).json({ error: 'Missing sheetId or invalid rowIndex' });
    return;
  }
  try {
    await deleteRow(sheets, sheetId, SHEET_NAMES.PAYMENT_METHODS, rowIndex);
    res.json({ ok: true });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('deletePaymentMethod', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete option' });
  }
}

/** DELETE /api/options/payors/:rowIndex?sheetId=xxx */
export async function deletePayor(req: Request, res: Response) {
  const sheets = getSheets(req);
  const sheetId = getSheetId(req);
  const rowIndex = Number(req.params.rowIndex);
  if (!sheets || !sheetId || !Number.isInteger(rowIndex) || rowIndex < 2) {
    res.status(400).json({ error: 'Missing sheetId or invalid rowIndex' });
    return;
  }
  try {
    await deleteRow(sheets, sheetId, SHEET_NAMES.PAYORS, rowIndex);
    res.json({ ok: true });
  } catch (err) {
    if (isRateLimitError(err)) {
      res.set('Retry-After', '60');
      res.status(503).json({
        error: 'Too many requests. Please try again in a minute.',
        code: 'RATE_LIMIT',
      });
      return;
    }
    console.error('deletePayor', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete option' });
  }
}

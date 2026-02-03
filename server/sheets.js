import { google } from 'googleapis';
import { SHEET_NAMES, MASTER_HEADERS, MONTHLY_HEADERS, OPTION_HEADERS, REQUIRED_SHEETS, STATUS_UNPAID, } from './constants.js';
function getAuth(credentials) {
    const key = typeof credentials === 'string'
        ? JSON.parse(credentials)
        : credentials;
    return new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
}
export function getSheetsClient(credentials) {
    const auth = getAuth(credentials);
    return google.sheets({ version: 'v4', auth });
}
export async function getSheetMetadata(sheets, spreadsheetId) {
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    return {
        title: res.data.properties?.title,
        sheets: (res.data.sheets ?? []).map((s) => ({
            id: s.properties?.sheetId,
            title: s.properties?.title ?? '',
        })),
    };
}
/** Validate workbook has required sheet names and headers; returns { valid, error? } */
export async function validateWorkbook(sheets, spreadsheetId) {
    const meta = await getSheetMetadata(sheets, spreadsheetId);
    const titles = new Set(meta.sheets.map((s) => s.title));
    for (const name of REQUIRED_SHEETS) {
        if (!titles.has(name)) {
            return { valid: false, error: `Missing sheet: "${name}". Required sheets: ${REQUIRED_SHEETS.join(', ')}.` };
        }
    }
    const expectedHeaders = {
        [SHEET_NAMES.MASTER]: MASTER_HEADERS,
        [SHEET_NAMES.MONTHLY]: MONTHLY_HEADERS,
        [SHEET_NAMES.PAYMENT_METHODS]: OPTION_HEADERS,
        [SHEET_NAMES.PAYORS]: OPTION_HEADERS,
    };
    for (const [sheetName, headers] of Object.entries(expectedHeaders)) {
        const range = `'${sheetName}'!A1:${String.fromCharCode(64 + headers.length)}1`;
        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const row = (res.data.values ?? [])[0] ?? [];
        const actual = headers.map((_, i) => (row[i] ?? '').toString().trim());
        if (actual.join(',') !== headers.join(',')) {
            return {
                valid: false,
                error: `Sheet "${sheetName}" should have headers: ${headers.join(', ')}. Got: ${actual.join(', ') || '(empty)'}.`,
            };
        }
    }
    return { valid: true };
}
/** Read all data from a sheet (including header row) */
export async function readSheet(sheets, spreadsheetId, sheetName, columns) {
    const range = `'${sheetName}'!A1:${String.fromCharCode(64 + Math.min(columns, 26))}`;
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return (res.data.values ?? []);
}
/** Append rows to a sheet */
export async function appendRows(sheets, spreadsheetId, sheetName, rows) {
    const range = `'${sheetName}'!A:A`;
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
    });
}
/** Update a single row (1-based row index, e.g. 2 = first data row) */
export async function updateRow(sheets, spreadsheetId, sheetName, rowIndex, values, numCols) {
    const range = `'${sheetName}'!A${rowIndex}:${String.fromCharCode(64 + numCols)}${rowIndex}`;
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    });
}
/** Clear and optionally resize: delete rows after header (Master/Monthly have many rows) */
export async function deleteRow(sheets, spreadsheetId, sheetName, rowIndex) {
    const meta = await getSheetMetadata(sheets, spreadsheetId);
    const sheet = meta.sheets.find((s) => s.title === sheetName);
    if (sheet?.id === undefined)
        return;
    const sheetId = sheet.id;
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex,
                        },
                    },
                },
            ],
        },
    });
}
/** Ensure Monthly has rows for the given month for every Master row; returns count appended */
export async function ensureMonth(sheets, spreadsheetId, monthYear) {
    const masterRows = await readSheet(sheets, spreadsheetId, SHEET_NAMES.MASTER, MASTER_HEADERS.length);
    const dataRows = masterRows.slice(1).filter((row) => row.some((c) => c.trim() !== ''));
    if (dataRows.length === 0)
        return 0;
    const monthlyRows = await readSheet(sheets, spreadsheetId, SHEET_NAMES.MONTHLY, MONTHLY_HEADERS.length);
    const existingForMonth = monthlyRows
        .slice(1)
        .filter((row) => (row[0] ?? '').toString().trim() === monthYear);
    if (existingForMonth.length >= dataRows.length)
        return 0;
    const masterNames = dataRows.map((row) => (row[1] ?? '').toString().trim());
    const existingNames = new Set(existingForMonth.map((row) => (row[1] ?? '').toString().trim()));
    const toAppend = [];
    for (let i = 0; i < masterNames.length; i++) {
        const name = masterNames[i];
        if (!name || existingNames.has(name))
            continue;
        const amount = dataRows[i][4] ?? '';
        toAppend.push([monthYear, name, STATUS_UNPAID, amount]);
        existingNames.add(name);
    }
    if (toAppend.length > 0) {
        await appendRows(sheets, spreadsheetId, SHEET_NAMES.MONTHLY, toAppend);
    }
    return toAppend.length;
}

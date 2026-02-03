const getBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return 'http://localhost:3001';
};

export type MasterRow = {
  Id: string;
  Name: string;
  'Payment Method': string;
  Payor: string;
  Amount: string;
  Order: string;
};

export type MonthlyRow = {
  MonthYear: string;
  ExpenseId: string;
  Status: string;
  Amount: string;
};

export type DataResponse = {
  master: MasterRow[];
  monthly: MonthlyRow[];
  paymentMethods: string[];
  payors: string[];
};

export type ValidateResponse = { valid: true } | { valid: false; error: string };

export async function fetchData(sheetId: string, month: string): Promise<DataResponse> {
  const url = `${getBaseUrl()}/api/data?sheetId=${encodeURIComponent(sheetId)}&month=${encodeURIComponent(month)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function ensureMonth(sheetId: string, month: string): Promise<{ appended: number }> {
  const url = `${getBaseUrl()}/api/ensure-month`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetId, month }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** rowIndex: 1-based index in monthly list + 1 (sheet row = index + 2). So rowIndex = sheetRow (2-based). */
export async function updateMonthlyStatus(
  sheetId: string,
  month: string,
  rowIndex: number,
  status: 'Paid' | 'Un-Paid'
): Promise<void> {
  const url = `${getBaseUrl()}/api/monthly/status`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetId, month, rowIndex, status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

export async function validateWorkbook(sheetId: string): Promise<ValidateResponse> {
  const url = `${getBaseUrl()}/api/validate?sheetId=${encodeURIComponent(sheetId)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) return { valid: false, error: data.error || `HTTP ${res.status}` };
  return data;
}

export async function addMaster(sheetId: string, row: Partial<MasterRow>): Promise<void> {
  const url = `${getBaseUrl()}/api/master`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sheetId,
      row: {
        Id: row.Id ?? '',
        Name: row.Name ?? '',
        'Payment Method': row['Payment Method'] ?? '',
        Payor: row.Payor ?? '',
        Amount: row.Amount ?? '',
        Order: row.Order ?? '',
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

/** sheetRowIndex: 2-based (row 2 = first data row) */
export async function updateMaster(
  sheetId: string,
  sheetRowIndex: number,
  row: Partial<MasterRow>
): Promise<void> {
  const url = `${getBaseUrl()}/api/master/${sheetRowIndex}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sheetId,
      row: {
        Id: row.Id ?? '',
        Name: row.Name ?? '',
        'Payment Method': row['Payment Method'] ?? '',
        Payor: row.Payor ?? '',
        Amount: row.Amount ?? '',
        Order: row.Order ?? '',
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

export async function deleteMasterRow(sheetId: string, sheetRowIndex: number): Promise<void> {
  const url = `${getBaseUrl()}/api/master/${sheetRowIndex}?sheetId=${encodeURIComponent(sheetId)}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

export async function addPaymentMethod(sheetId: string, name: string): Promise<void> {
  const url = `${getBaseUrl()}/api/options/payment-methods`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetId, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

export async function addPayor(sheetId: string, name: string): Promise<void> {
  const url = `${getBaseUrl()}/api/options/payors`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetId, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

/** sheetRowIndex: 2-based */
export async function deletePaymentMethodOption(
  sheetId: string,
  sheetRowIndex: number
): Promise<void> {
  const url = `${getBaseUrl()}/api/options/payment-methods/${sheetRowIndex}?sheetId=${encodeURIComponent(sheetId)}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

export async function deletePayorOption(sheetId: string, sheetRowIndex: number): Promise<void> {
  const url = `${getBaseUrl()}/api/options/payors/${sheetRowIndex}?sheetId=${encodeURIComponent(sheetId)}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

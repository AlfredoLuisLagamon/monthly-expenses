import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSheetId } from '../contexts/SheetIdContext';
import { getCurrentMonthYear } from '../lib/month';
import { STORAGE_KEYS } from '../constants/storage';
import * as api from '../lib/api';

export type ExpenseData = api.DataResponse & { month: string };

const STALE_MS = 90 * 1000;

export function useExpenses() {
  const { sheetId } = useSheetId();
  const [month] = useState(() => getCurrentMonthYear());
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatusRow, setUpdatingStatusRow] = useState<number | null>(null);
  const lastFetchedAt = useRef<number>(0);

  const load = useCallback(async (forceRefresh = false) => {
    if (!sheetId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    if (!forceRefresh && data && Date.now() - lastFetchedAt.current < STALE_MS) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchData(sheetId, month);
      const payload: ExpenseData = { ...response, month };
      lastFetchedAt.current = Date.now();
      setData(payload);
      AsyncStorage.setItem(STORAGE_KEYS.CACHE_DATA, JSON.stringify(payload));
      AsyncStorage.setItem(STORAGE_KEYS.CACHE_MONTH, month);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load';
      setError(msg);
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_DATA);
      const cachedMonth = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_MONTH);
      if (cached && cachedMonth === month) {
        try {
          setData(JSON.parse(cached) as ExpenseData);
        } catch {
          setData(null);
        }
      } else {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [sheetId, month]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = useCallback(
    async (sheetRowIndex: number, status: 'Paid' | 'Un-Paid') => {
      if (!sheetId || !data) return;
      setUpdatingStatusRow(sheetRowIndex);
      try {
        await api.updateMonthlyStatus(sheetId, month, sheetRowIndex, status);
        setData((prev) => {
          if (!prev) return prev;
          const monthly = prev.monthly.map((r, i) => {
            const rowNum = i + 2;
            if (rowNum === sheetRowIndex) return { ...r, Status: status };
            return r;
          });
          return { ...prev, monthly };
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update');
      } finally {
        setUpdatingStatusRow(null);
      }
    },
    [sheetId, month, data]
  );

  return { data, loading, error, reload: load, updateStatus, month, updatingStatusRow };
}

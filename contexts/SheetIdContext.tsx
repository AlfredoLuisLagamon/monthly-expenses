import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

type SheetIdContextValue = {
  sheetId: string | null;
  setSheetId: (id: string | null) => void;
  isLoading: boolean;
};

const SheetIdContext = createContext<SheetIdContextValue | null>(null);

export function SheetIdProvider({ children }: { children: React.ReactNode }) {
  const [sheetId, setSheetIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.SHEET_ID).then((id) => {
      setSheetIdState(id ?? null);
      setIsLoading(false);
    });
  }, []);

  const setSheetId = useCallback((id: string | null) => {
    setSheetIdState(id);
    if (id === null) {
      AsyncStorage.removeItem(STORAGE_KEYS.SHEET_ID);
    } else {
      AsyncStorage.setItem(STORAGE_KEYS.SHEET_ID, id);
    }
  }, []);

  const value: SheetIdContextValue = { sheetId, setSheetId, isLoading };
  return (
    <SheetIdContext.Provider value={value}>{children}</SheetIdContext.Provider>
  );
}

export function useSheetId() {
  const ctx = useContext(SheetIdContext);
  if (!ctx) throw new Error('useSheetId must be used within SheetIdProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'bepelican-display-currency';

interface DisplayCurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (code: string) => void;
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextType | null>(null);

function readStoredCurrency(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || 'COP';
  } catch {
    return 'COP';
  }
}

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState(readStoredCurrency);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, displayCurrency);
    } catch {
      /* ignore quota / private mode */
    }
  }, [displayCurrency]);

  const setDisplayCurrency = useCallback((code: string) => {
    setDisplayCurrencyState(code);
  }, []);

  const value = useMemo(
    () => ({ displayCurrency, setDisplayCurrency }),
    [displayCurrency, setDisplayCurrency]
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>{children}</DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency() {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) {
    throw new Error('useDisplayCurrency must be used within DisplayCurrencyProvider');
  }
  return ctx;
}

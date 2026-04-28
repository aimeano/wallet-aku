import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CurrencyCode = "USD" | "EUR" | "JPY" | "KRW" | "MYR";

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  symbolBefore: boolean;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: "USD", symbol: "$",  name: "US Dollar",        decimals: 2, symbolBefore: true },
  EUR: { code: "EUR", symbol: "€",  name: "Euro",             decimals: 2, symbolBefore: true },
  JPY: { code: "JPY", symbol: "¥",  name: "Japanese Yen",     decimals: 0, symbolBefore: true },
  KRW: { code: "KRW", symbol: "₩",  name: "Korean Won",       decimals: 0, symbolBefore: true },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", decimals: 2, symbolBefore: true },
};

const STORAGE_KEY = "pocket.currency";

interface Ctx {
  currency: Currency;
  setCurrency: (c: CurrencyCode) => void;
  format: (n: number) => string;
}

const CurrencyContext = createContext<Ctx>({
  currency: CURRENCIES.USD,
  setCurrency: () => {},
  format: (n) => n.toString(),
});

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [code, setCode] = useState<CurrencyCode>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return (stored && stored in CURRENCIES ? (stored as CurrencyCode) : "USD");
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
  }, [code]);

  const currency = CURRENCIES[code];

  const format = (n: number) => {
    const negative = n < 0;
    const abs = Math.abs(n);
    const num = abs.toLocaleString("en-US", {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    });
    const sep = currency.symbol.length > 1 ? " " : "";
    const body = currency.symbolBefore ? `${currency.symbol}${sep}${num}` : `${num}${sep}${currency.symbol}`;
    return negative ? `-${body}` : body;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: setCode, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

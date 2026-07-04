import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";

const STORAGE_KEY = "samesky_currency";
const DEFAULT_CURRENCY = "USD";

interface RatesResponse {
  base: string;
  rates: Record<string, number>;
  supported: string[];
  fetchedAt: number | null;
}

interface CurrencyContextValue {
  /** Active display currency (ISO 4217). */
  currency: string;
  /** Change the display currency; persists to localStorage and (if signed in) the DB. */
  setCurrency: (code: string) => void;
  /** Live USD-based rate table. */
  rates: Record<string, number>;
  /** Currencies Stripe can charge natively (curated switcher list). */
  supportedCurrencies: string[];
  /** Whether the active currency can be charged natively (else USD fallback at checkout). */
  isNativelyCharged: boolean;
  /** True while rates are still loading. */
  isLoading: boolean;
  /** Format a USD amount into the active currency's local value. */
  formatFromUsd: (usdAmount: number) => string;
  /** Convert a USD amount to the active currency's numeric value (no formatting). */
  convertFromUsd: (usdAmount: number) => number;
  /** Format an already-local minor-unit amount (e.g. from Stripe) in a given currency. */
  formatMinorUnits: (minorUnits: number, currencyCode: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const ZERO_DECIMAL = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
  "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

function decimalsFor(code: string): number {
  if (ZERO_DECIMAL.has(code.toUpperCase())) return 0;
  try {
    return (
      new Intl.NumberFormat("en-US", { style: "currency", currency: code })
        .resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

function formatCurrency(amount: number, code: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: decimalsFor(code),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const ratesQuery = useQuery<RatesResponse>({
    queryKey: ["currency-rates"],
    queryFn: async () => {
      const res = await fetch("/api/currency/rates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load exchange rates");
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const [currency, setCurrencyState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY)?.toUpperCase() || DEFAULT_CURRENCY,
  );
  const [resolved, setResolved] = useState<boolean>(
    () => !!localStorage.getItem(STORAGE_KEY),
  );

  // Auto-detect on first visit: DB preference -> IP geolocation -> USD.
  useEffect(() => {
    if (resolved) return;
    let cancelled = false;

    (async () => {
      try {
        const pref = await fetch("/api/currency/preference", { credentials: "include" });
        if (pref.ok) {
          const data = (await pref.json()) as { currencyPreference: string | null };
          if (!cancelled && data.currencyPreference) {
            setCurrencyState(data.currencyPreference.toUpperCase());
            localStorage.setItem(STORAGE_KEY, data.currencyPreference.toUpperCase());
            setResolved(true);
            return;
          }
        }
      } catch {
        /* ignore — fall through to IP detection */
      }

      try {
        const detect = await fetch("/api/currency/detect", { credentials: "include" });
        if (detect.ok) {
          const data = (await detect.json()) as { currency: string };
          if (!cancelled && data.currency) {
            setCurrencyState(data.currency.toUpperCase());
            setResolved(true);
            return;
          }
        }
      } catch {
        /* ignore — stay on default */
      }

      if (!cancelled) setResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [resolved]);

  const setCurrency = useCallback((code: string) => {
    const next = code.toUpperCase();
    setCurrencyState(next);
    setResolved(true);
    localStorage.setItem(STORAGE_KEY, next);
    // Persist to the DB for signed-in users; ignore failures (guests).
    void fetch("/api/currency/preference", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currency: next }),
    }).catch(() => {});
  }, []);

  const rates = ratesQuery.data?.rates ?? { USD: 1 };
  const supportedCurrencies = ratesQuery.data?.supported ?? [DEFAULT_CURRENCY];

  const value = useMemo<CurrencyContextValue>(() => {
    const rawRate = rates[currency];
    const hasRate = typeof rawRate === "number" && rawRate > 0;
    // If we have no live rate for the selected currency, never fake a 1:1 rate
    // (that would misprice). Display in USD until a real rate is available.
    const displayCurrency = hasRate ? currency : DEFAULT_CURRENCY;
    const rate = hasRate ? rawRate : 1;
    return {
      currency,
      setCurrency,
      rates,
      supportedCurrencies,
      isNativelyCharged: hasRate && supportedCurrencies.includes(currency),
      isLoading: ratesQuery.isLoading,
      convertFromUsd: (usd: number) => usd * rate,
      formatFromUsd: (usd: number) => formatCurrency(usd * rate, displayCurrency),
      formatMinorUnits: (minor: number, code: string) =>
        formatCurrency(minor / Math.pow(10, decimalsFor(code)), code),
    };
  }, [currency, rates, supportedCurrencies, setCurrency, ratesQuery.isLoading]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}

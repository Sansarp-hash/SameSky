/**
 * Currency engine for SameSky.
 *
 * The whole platform prices everything in USD internally (the base currency).
 * At display and checkout time we convert to the user's local currency using
 * live exchange rates. This module is the single source of truth for:
 *
 *   - fetching + caching live USD-based exchange rates
 *   - mapping a country (ISO-3166 alpha-2) to its currency (ISO-4217)
 *   - the set of currencies we support and which of those Stripe can charge
 *   - converting a USD amount into another currency's minor units
 *
 * Live rates come from the free, no-auth open.er-api.com endpoint and are
 * cached for an hour. If a refresh fails we fall back to the last known rate
 * table; we only throw when no table has ever been obtained.
 *
 * NOTE: the legacy Paystack helpers (getUsdToGhsRate / usdCentsToGhsPesewas)
 * are kept for the existing coin-pack flow which settles in GHS.
 */

const RATE_ENDPOINT = "https://open.er-api.com/v6/latest/USD";
const RATE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const BASE_CURRENCY = "USD";
export const SETTLEMENT_CURRENCY = "GHS"; // Paystack settlement currency (legacy)

// ─── Rate cache ───────────────────────────────────────────────────────────────

let cachedRates: { rates: Record<string, number>; fetchedAt: number } | null = null;

/**
 * Fetch the full live USD-based rate table, cached for an hour.
 * Falls back to the last known table if a refresh fails; throws only when no
 * table has ever been obtained.
 */
export async function getUsdRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && now - cachedRates.fetchedAt < RATE_TTL_MS) {
    return cachedRates.rates;
  }

  try {
    const resp = await fetch(RATE_ENDPOINT, { signal: AbortSignal.timeout(10_000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = (await resp.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data.result !== "success" || !data.rates || typeof data.rates.USD !== "number") {
      throw new Error("response missing a valid rate table");
    }

    cachedRates = { rates: data.rates, fetchedAt: now };
    return data.rates;
  } catch (err) {
    if (cachedRates) return cachedRates.rates;
    throw new Error(
      `Failed to fetch USD exchange rates: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/** When the current rate table was fetched (ms epoch), or null if never. */
export function getRatesFetchedAt(): number | null {
  return cachedRates?.fetchedAt ?? null;
}

/** Get the USD -> target rate. Throws if the currency is unknown. */
export async function getRate(currency: string): Promise<number> {
  const code = currency.toUpperCase();
  const rates = await getUsdRates();
  const rate = rates[code];
  if (typeof rate !== "number" || rate <= 0) {
    throw new Error(`No exchange rate available for currency: ${code}`);
  }
  return rate;
}

// ─── Legacy Paystack helpers (GHS) ────────────────────────────────────────────

export async function getUsdToGhsRate(): Promise<number> {
  return getRate("GHS");
}

export function usdCentsToGhsPesewas(usdCents: number, usdToGhsRate: number): number {
  const usd = usdCents / 100;
  const ghs = usd * usdToGhsRate;
  return Math.round(ghs * 100);
}

// ─── Currency metadata ────────────────────────────────────────────────────────

/**
 * Currencies with no minor unit (amounts are whole numbers). Matches the ISO
 * 4217 zero-decimal set, which is also what Stripe expects.
 */
const ZERO_DECIMAL = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF",
  "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

/** Number of minor-unit decimals for a currency (0, 2, or 3). */
export function currencyDecimals(currency: string): number {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL.has(code)) return 0;
  try {
    const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: code });
    return fmt.resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/**
 * Currencies Stripe can settle. Superset of the ISO codes commonly accepted by
 * Stripe. Anything not in this set falls back to USD at checkout with a notice.
 */
export const STRIPE_SUPPORTED = new Set([
  "USD", "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BIF", "BMD", "BND", "BOB", "BRL", "BSD", "BWP",
  "BYN", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CVE", "CZK",
  "DJF", "DKK", "DOP", "DZD", "EGP", "ETB", "EUR", "FJD", "FKP", "GBP", "GEL",
  "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF",
  "IDR", "ILS", "INR", "ISK", "JMD", "JPY", "KES", "KGS", "KHR", "KMF", "KRW",
  "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "MAD", "MDL", "MGA", "MKD",
  "MMK", "MNT", "MOP", "MRO", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN", "NAD",
  "NGN", "NIO", "NOK", "NPR", "NZD", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN",
  "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SEK", "SGD",
  "SHP", "SLE", "SOS", "SRD", "STD", "SZL", "THB", "TJS", "TOP", "TRY", "TTD",
  "TWD", "TZS", "UAH", "UGX", "UYU", "UZS", "VND", "VUV", "WST", "XAF", "XCD",
  "XOF", "XPF", "YER", "ZAR", "ZMW",
]);

export function isStripeSupported(currency: string): boolean {
  return STRIPE_SUPPORTED.has(currency.toUpperCase());
}

/**
 * Convert a USD amount (in cents) to another currency's smallest unit, ready
 * for a payment provider. Returns whole-number minor units (e.g. cents, yen).
 */
export function convertUsdCents(
  usdCents: number,
  currency: string,
  usdRate: number,
): number {
  const usd = usdCents / 100;
  const amount = usd * usdRate;
  const decimals = currencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor);
}

/**
 * Resolve which currency to actually charge in. Returns the requested currency
 * when Stripe supports it, otherwise falls back to USD and flags it so the UI
 * can explain the substitution before payment.
 */
export function resolveChargeCurrency(requested: string): {
  currency: string;
  fellBack: boolean;
  requested: string;
} {
  const code = (requested || BASE_CURRENCY).toUpperCase();
  if (isStripeSupported(code)) return { currency: code, fellBack: false, requested: code };
  return { currency: BASE_CURRENCY, fellBack: true, requested: code };
}

/**
 * Rate-aware version of {@link resolveChargeCurrency}. Falls back to USD both
 * when Stripe cannot settle the currency AND when no live FX rate exists for it,
 * so checkout never fails on an unpriceable currency. USD always uses a rate of 1.
 */
export async function resolveChargeCurrencyWithRate(requested: string): Promise<{
  currency: string;
  rate: number;
  fellBack: boolean;
  requested: string;
}> {
  const code = (requested || BASE_CURRENCY).toUpperCase();
  if (code !== BASE_CURRENCY && isStripeSupported(code)) {
    try {
      const rate = await getRate(code);
      return { currency: code, rate, fellBack: false, requested: code };
    } catch {
      // No live FX rate for this currency — fall through to USD below.
    }
  }
  return { currency: BASE_CURRENCY, rate: 1, fellBack: code !== BASE_CURRENCY, requested: code };
}

// ─── Country -> currency mapping (ISO-3166 alpha-2 -> ISO-4217) ────────────────

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", IE: "EUR", NG: "NGN", GH: "GHS", KE: "KES",
  ZA: "ZAR", TZ: "TZS", UG: "UGX", RW: "RWF", ET: "ETB", EG: "EGP", MA: "MAD",
  DZ: "DZD", TN: "TND", CM: "XAF", CI: "XOF", SN: "XOF", ZM: "ZMW", ZW: "USD",
  IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", JP: "JPY", CN: "CNY",
  HK: "HKD", TW: "TWD", KR: "KRW", SG: "SGD", MY: "MYR", ID: "IDR", TH: "THB",
  VN: "VND", PH: "PHP", AU: "AUD", NZ: "NZD", AE: "AED", SA: "SAR", QA: "QAR",
  KW: "KWD", BH: "BHD", OM: "OMR", JO: "JOD", LB: "LBP", IL: "ILS", TR: "TRY",
  RU: "RUB", UA: "UAH", KZ: "KZT",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR",
  PT: "EUR", GR: "EUR", FI: "EUR", LU: "EUR", SK: "EUR", SI: "EUR", EE: "EUR",
  LV: "EUR", LT: "EUR", CY: "EUR", MT: "EUR", HR: "EUR",
  CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF",
  RO: "RON", BG: "BGN", IS: "ISK",
  BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", UY: "UYU",
  VE: "USD", EC: "USD", BO: "BOB", PY: "PYG", CR: "CRC", GT: "GTQ", PA: "USD",
  DO: "DOP", JM: "JMD", TT: "TTD",
};

/** Map an ISO country code to its currency, defaulting to USD. */
export function currencyForCountry(country: string | null | undefined): string {
  if (!country) return BASE_CURRENCY;
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? BASE_CURRENCY;
}

/** Sorted list of the currencies we surface in the manual currency picker. */
export function supportedCurrencyList(): string[] {
  return Array.from(STRIPE_SUPPORTED).sort();
}

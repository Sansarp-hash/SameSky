/**
 * Currency conversion for Paystack.
 *
 * The Paystack account settles in GHS (Ghana Cedis), so USD prices shown to
 * users are converted to GHS at checkout time before charging. Prices are
 * displayed in USD everywhere in the UI; only the actual charge is in GHS.
 *
 * Uses the free, no-auth exchangerate-api endpoint and caches the rate for an
 * hour to avoid hitting it on every checkout. If the live rate is unavailable
 * and no cached rate exists, conversion fails explicitly rather than guessing.
 */

const RATE_ENDPOINT = "https://open.er-api.com/v6/latest/USD";
const RATE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const SETTLEMENT_CURRENCY = "GHS";

let cachedRate: { rate: number; fetchedAt: number } | null = null;

/**
 * Fetch the live USD -> GHS exchange rate, cached for an hour.
 * Falls back to the last known rate if a refresh fails; throws only when no
 * rate has ever been obtained.
 */
export async function getUsdToGhsRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate && now - cachedRate.fetchedAt < RATE_TTL_MS) {
    return cachedRate.rate;
  }

  try {
    const resp = await fetch(RATE_ENDPOINT, { signal: AbortSignal.timeout(10_000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = (await resp.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    const rate = data.rates?.GHS;
    if (data.result !== "success" || typeof rate !== "number" || rate <= 0) {
      throw new Error("response missing a valid GHS rate");
    }

    cachedRate = { rate, fetchedAt: now };
    return rate;
  } catch (err) {
    if (cachedRate) return cachedRate.rate;
    throw new Error(
      `Failed to fetch USD->GHS exchange rate: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Convert an amount in USD cents to GHS pesewas (subunits), the format Paystack
 * expects. Rounds to the nearest pesewa to avoid floating-point drift.
 */
export function usdCentsToGhsPesewas(usdCents: number, usdToGhsRate: number): number {
  const usd = usdCents / 100;
  const ghs = usd * usdToGhsRate;
  return Math.round(ghs * 100);
}

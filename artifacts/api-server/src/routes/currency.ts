/**
 * Currency routes: live rates, IP-based currency detection, and per-user
 * currency preference. Prices are displayed in the user's local currency but
 * always computed from a USD base with these live rates.
 */

import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  getUsdRates,
  getRatesFetchedAt,
  supportedCurrencyList,
  currencyForCountry,
  isStripeSupported,
  BASE_CURRENCY,
} from "../lib/currency";
import { getOrCreateUser } from "./users";

const router = Router();

// ─── Simple per-IP geo cache ──────────────────────────────────────────────────
const geoCache = new Map<string, { country: string | null; at: number }>();
const GEO_TTL_MS = 10 * 60 * 1000;

function getClientIp(req: Request): string | null {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  const ip = raw?.split(",")[0]?.trim() || req.socket.remoteAddress || null;
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.")) return null;
  return ip;
}

async function lookupCountry(ip: string): Promise<string | null> {
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.at < GEO_TTL_MS) return cached.country;
  try {
    const resp = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code`, {
      signal: AbortSignal.timeout(4_000),
    });
    const data = (await resp.json()) as { success?: boolean; country_code?: string };
    const country = data.success && data.country_code ? data.country_code : null;
    geoCache.set(ip, { country, at: Date.now() });
    return country;
  } catch {
    geoCache.set(ip, { country: null, at: Date.now() });
    return null;
  }
}

// ─── GET /currency/rates — live rates + supported list ────────────────────────
router.get("/rates", async (req: Request, res: Response) => {
  try {
    const rates = await getUsdRates();
    // Only surface currencies we can actually price right now (Stripe-settleable
    // AND present in the live rate table), so the switcher never offers a code
    // that would silently fall back to USD at checkout.
    const supported = supportedCurrencyList().filter((code) => code in rates);
    res.json({
      base: BASE_CURRENCY,
      rates,
      supported,
      fetchedAt: getRatesFetchedAt(),
    });
  } catch (err) {
    (req as any).log?.error({ err }, "Failed to load rates");
    res.status(503).json({ error: "Exchange rates temporarily unavailable" });
  }
});

// ─── GET /currency/detect — detect currency from client IP ────────────────────
router.get("/detect", async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const country = ip ? await lookupCountry(ip) : null;
  const currency = currencyForCountry(country);
  res.json({ country, currency, supported: isStripeSupported(currency) });
});

// ─── GET /currency/preference — the signed-in user's saved currency ───────────
router.get("/preference", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    res.json({ currencyPreference: user.currencyPreference ?? null });
  } catch (err) {
    (req as any).log?.error({ err }, "Failed to read currency preference");
    res.status(500).json({ error: "Failed to read preference" });
  }
});

// ─── PUT /currency/preference — save the user's currency ──────────────────────
router.put("/preference", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = (req.body?.currency ?? "").toString().toUpperCase();
  if (!/^[A-Z]{3}$/.test(raw)) {
    res.status(400).json({ error: "currency must be a 3-letter ISO code" });
    return;
  }

  try {
    const rates = await getUsdRates();
    if (!(raw in rates)) {
      res.status(400).json({ error: `Unsupported currency: ${raw}` });
      return;
    }
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }

    await db.update(usersTable).set({ currencyPreference: raw }).where(eq(usersTable.id, user.id));
    res.json({ currencyPreference: raw });
  } catch (err) {
    (req as any).log?.error({ err }, "Failed to save currency preference");
    res.status(500).json({ error: "Failed to save preference" });
  }
});

export default router;

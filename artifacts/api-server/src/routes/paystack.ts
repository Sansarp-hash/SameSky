/**
 * Paystack payment routes for SameSky.
 *
 * Flow:
 *   1. POST /api/paystack/checkout/coins       — init coin pack purchase
 *   2. POST /api/paystack/checkout/mystic-premium — init Mystic Premium purchase
 *   3. GET  /api/paystack/verify?reference=xxx  — verify + fulfill after redirect
 *
 * Pricing is defined in USD (cents). The Paystack account settles in GHS, so
 * each charge is converted USD -> GHS at init time (see lib/currency.ts). The
 * original USD amount is preserved in transaction metadata for record-keeping.
 */

import { Router, type Request, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import {
  usersTable,
  coinTransactionsTable,
  coinPurchasesTable,
  fmUsersTable,
  notificationsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { initializeTransaction, verifyTransaction } from "../lib/paystackClient";
import { getOrCreateUser } from "./users";
import { randomUUID } from "crypto";

// ─── Resolve the public-facing origin for Paystack callback URLs ──────────────
// In Replit's proxied environment req.get("host") may return an internal
// hostname. Prefer REPLIT_DOMAINS (always the real public domain) first.
function getPublicOrigin(req: Request): string {
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    const primary = domains.split(",")[0]?.trim();
    if (primary) return `https://${primary}`;
  }
  const fwdHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(fwdHost) ? fwdHost[0] : (fwdHost ?? req.get("host") ?? "localhost");
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol ?? "https";
  return `${proto}://${host}`;
}

const router = Router();

// ─── Coin pack catalogue (amount in cents, USD) ───────────────────────────────
export const COIN_PACKS = [
  { id: "starter",  name: "Starter Pack",  stars: 100,  cents: 200  }, // $2
  { id: "fan",      name: "Fan Pack",       stars: 500,  cents: 800  }, // $8
  { id: "superfan", name: "Super Fan",      stars: 1200, cents: 1800 }, // $18
  { id: "legend",   name: "Legend Pack",    stars: 3000, cents: 4000 }, // $40
] as const;

export const MYSTIC_PREMIUM_CENTS = 500; // $5

// ─── Helper: get user's email from Clerk ─────────────────────────────────────
async function getUserEmail(clerkId: string): Promise<string> {
  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    return clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkId}@samesky.internal`;
  } catch {
    return `${clerkId}@samesky.internal`;
  }
}

// ─── GET /paystack/products — list coin packs ─────────────────────────────────
router.get("/paystack/products", (_req: Request, res: Response) => {
  res.json({
    coinPacks: COIN_PACKS.map((p) => ({
      ...p,
      priceUsd: p.cents / 100,
    })),
    mysticPremium: {
      name: "Mystic Premium",
      description: "Unlimited ships, actresses, series & characters",
      priceUsd: MYSTIC_PREMIUM_CENTS / 100,
    },
  });
});

// ─── POST /paystack/checkout/coins — initialize coin purchase ─────────────────
router.post("/paystack/checkout/coins", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { packId } = req.body ?? {};
  const pack = COIN_PACKS.find((p) => p.id === packId);
  if (!pack) {
    res.status(400).json({ error: `Invalid packId. Valid options: ${COIN_PACKS.map((p) => p.id).join(", ")}` });
    return;
  }

  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }

    const email = await getUserEmail(clerkId);
    const reference = `coins_${user.id}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const origin = getPublicOrigin(req);

    const init = await initializeTransaction({
      email,
      amountCents: pack.cents,
      reference,
      callbackUrl: `${origin}/api/paystack/verify`,
      metadata: {
        type: "coin_pack",
        packId: pack.id,
        stars: String(pack.stars),
        userId: String(user.id),
        clerkId,
      },
    });

    res.json({ authorizationUrl: init.authorization_url, reference: init.reference });
  } catch (err) {
    (req as any).log?.error({ err }, "Paystack coin checkout error");
    res.status(500).json({ error: "Failed to initialize payment" });
  }
});

// ─── POST /paystack/checkout/mystic-premium — initialize premium purchase ─────
router.post("/paystack/checkout/mystic-premium", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }

    const [fmUser] = await db
      .select({ subscriptionTier: fmUsersTable.subscriptionTier })
      .from(fmUsersTable)
      .where(eq(fmUsersTable.clerkId, clerkId))
      .limit(1);
    if (fmUser?.subscriptionTier === "premium") {
      res.status(400).json({ error: "Already a Mystic Premium member" });
      return;
    }

    const email = await getUserEmail(clerkId);
    const reference = `mystic_${user.id}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const origin = getPublicOrigin(req);

    const init = await initializeTransaction({
      email,
      amountCents: MYSTIC_PREMIUM_CENTS,
      reference,
      callbackUrl: `${origin}/api/paystack/verify`,
      metadata: {
        type: "mystic_premium",
        userId: String(user.id),
        clerkId,
      },
    });

    res.json({ authorizationUrl: init.authorization_url, reference: init.reference });
  } catch (err) {
    (req as any).log?.error({ err }, "Paystack Mystic Premium checkout error");
    res.status(500).json({ error: "Failed to initialize payment" });
  }
});

// ─── GET /paystack/verify — Paystack redirects here after payment ─────────────
router.get("/paystack/verify", async (req: Request, res: Response) => {
  const reference = req.query.reference as string;
  if (!reference) { res.status(400).json({ error: "reference is required" }); return; }

  try {
    const data = await verifyTransaction(reference);

    if (data.status !== "success") {
      const origin = getPublicOrigin(req);
      res.redirect(`${origin}/?payment=failed&reference=${reference}`);
      return;
    }

    const { type } = data.metadata;

    if (type === "coin_pack") {
      await fulfillCoinPack(data);
      const origin = getPublicOrigin(req);
      res.redirect(`${origin}/?payment=success&type=coins&reference=${reference}`);
    } else if (type === "mystic_premium") {
      await fulfillMysticPremium(data);
      const origin = getPublicOrigin(req);
      res.redirect(`${origin}/?payment=success&type=mystic_premium&reference=${reference}`);
    } else {
      res.status(400).json({ error: "Unknown payment type" });
    }
  } catch (err) {
    (req as any).log?.error({ err }, "Paystack verification error");
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// ─── POST /paystack/verify — frontend calls this to confirm + fulfill ─────────
router.post("/paystack/verify", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { reference } = req.body ?? {};
  if (!reference || typeof reference !== "string") {
    res.status(400).json({ error: "reference is required" });
    return;
  }

  try {
    const data = await verifyTransaction(reference);

    if (data.metadata.clerkId && data.metadata.clerkId !== clerkId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (data.status !== "success") {
      res.status(402).json({ error: "Payment not completed", status: data.status });
      return;
    }

    const { type } = data.metadata;
    if (type === "coin_pack") {
      await fulfillCoinPack(data);
      res.json({ ok: true, type: "coin_pack", stars: parseInt(data.metadata.stars ?? "0") });
    } else if (type === "mystic_premium") {
      await fulfillMysticPremium(data);
      res.json({ ok: true, type: "mystic_premium" });
    } else {
      res.status(400).json({ error: "Unknown payment type" });
    }
  } catch (err) {
    (req as any).log?.error({ err }, "Paystack POST verify error");
    res.status(500).json({ error: "Verification failed" });
  }
});

// ─── Fulfillment helpers ──────────────────────────────────────────────────────

async function fulfillCoinPack(data: import("../lib/paystackClient").PaystackVerifyData) {
  const userId = parseInt(data.metadata.userId ?? "0");
  const stars = parseInt(data.metadata.stars ?? "0");
  if (!userId || !stars) throw new Error("Invalid metadata for coin pack fulfillment");

  // Idempotency: skip if this reference already processed
  const existing = await db.execute(
    sql`SELECT id FROM coin_purchases WHERE stripe_payment_intent_id = ${data.reference} LIMIT 1`,
  );
  if (existing.rows.length > 0) return;

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ coinBalance: sql`${usersTable.coinBalance} + ${stars}` })
      .where(eq(usersTable.id, userId));

    await tx.insert(coinTransactionsTable).values({
      userId,
      amount: stars,
      type: "purchase",
      description: `Purchased ${stars} Stars via Paystack`,
      targetRef: data.reference,
    });

    // data.amount is the GHS-charged amount; the original USD price lives in metadata.
    const usdCents = parseInt(data.metadata.usd_cents ?? "");
    if (!Number.isFinite(usdCents) || usdCents <= 0) {
      throw new Error(`Missing/invalid usd_cents in metadata for reference ${data.reference}`);
    }
    const priceUsd = usdCents / 100;
    await tx.insert(coinPurchasesTable).values({
      userId,
      packSize: stars,
      pricePaid: String(priceUsd),
      stripePaymentIntentId: data.reference,
    });

    await tx.insert(notificationsTable).values({
      userId,
      type: "coin_received",
      title: "Stars added to your wallet",
      message: `${stars} Stars have been added to your account. Enjoy!`,
    });
  });
}

async function fulfillMysticPremium(data: import("../lib/paystackClient").PaystackVerifyData) {
  const clerkId = data.metadata.clerkId;
  if (!clerkId) throw new Error("Missing clerkId in Paystack metadata");

  await db
    .update(fmUsersTable)
    .set({ subscriptionTier: "premium" })
    .where(eq(fmUsersTable.clerkId, clerkId));
}

export { fulfillMysticPremium };
export default router;

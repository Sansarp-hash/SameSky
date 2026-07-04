/**
 * Paystack payment routes for SameSky.
 *
 * Flow:
 *   1. POST /api/paystack/checkout/coins       — init coin pack purchase
 *   2. POST /api/paystack/checkout/mystic-premium — init Mystic Premium purchase
 *   3. GET  /api/paystack/verify?reference=xxx  — verify + fulfill after redirect
 *
 * Currency: GHS. Amounts in pesewas (1 GHS = 100 pesewas).
 */

import { Router, type Request, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import {
  usersTable,
  coinTransactionsTable,
  coinPurchasesTable,
  fmUsersTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { initializeTransaction, verifyTransaction } from "../lib/paystackClient";
import { getOrCreateUser } from "./users";
import { randomUUID } from "crypto";

const router = Router();

// ─── Coin pack catalogue (amount in pesewas) ──────────────────────────────────
export const COIN_PACKS = [
  { id: "starter",  name: "Starter Pack",  stars: 100,  pesewas: 500   }, // GHS 5
  { id: "fan",      name: "Fan Pack",       stars: 500,  pesewas: 2000  }, // GHS 20
  { id: "superfan", name: "Super Fan",      stars: 1200, pesewas: 4500  }, // GHS 45
  { id: "legend",   name: "Legend Pack",    stars: 3000, pesewas: 10000 }, // GHS 100
] as const;

export const MYSTIC_PREMIUM_PESEWAS = 1500; // GHS 15

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
      priceGhs: p.pesewas / 100,
    })),
    mysticPremium: {
      name: "Mystic Premium",
      description: "Unlimited ships, actresses, series & characters",
      priceGhs: MYSTIC_PREMIUM_PESEWAS / 100,
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
    const origin = `${req.protocol}://${req.get("host")}`;

    const init = await initializeTransaction({
      email,
      amountPesewas: pack.pesewas,
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

    // Check if already premium
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
    const origin = `${req.protocol}://${req.get("host")}`;

    const init = await initializeTransaction({
      email,
      amountPesewas: MYSTIC_PREMIUM_PESEWAS,
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
// Also used by the frontend to manually trigger verification.
router.get("/paystack/verify", async (req: Request, res: Response) => {
  const reference = req.query.reference as string;
  if (!reference) { res.status(400).json({ error: "reference is required" }); return; }

  try {
    const data = await verifyTransaction(reference);

    if (data.status !== "success") {
      // Redirect to frontend with failure indicator
      const origin = `${req.protocol}://${req.get("host")}`;
      res.redirect(`${origin}/?payment=failed&reference=${reference}`);
      return;
    }

    const { type } = data.metadata;

    if (type === "coin_pack") {
      await fulfillCoinPack(data);
      const origin = `${req.protocol}://${req.get("host")}`;
      res.redirect(`${origin}/?payment=success&type=coins&reference=${reference}`);
    } else if (type === "mystic_premium") {
      await fulfillMysticPremium(data);
      const origin = `${req.protocol}://${req.get("host")}`;
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

    // Confirm the reference belongs to this user
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

    const priceGhs = data.amount / 100;
    await tx.insert(coinPurchasesTable).values({
      userId,
      packSize: stars,
      pricePaid: String(priceGhs),
      stripePaymentIntentId: data.reference, // repurposed column for Paystack reference
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

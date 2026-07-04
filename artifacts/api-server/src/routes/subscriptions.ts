/**
 * Subscription routes: plan catalogue, current status, checkout, billing
 * portal, cancel/resume, and plan change. All pricing is server-derived; the
 * client only ever sends a plan id and a display currency.
 */

import { Router, type Request, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { getOrCreateUser } from "./users";
import { listPlans, getPlan } from "../lib/subscriptionPlans";
import {
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  resumeSubscription,
  changePlan,
} from "../lib/subscriptionService";
import { getSubscriptionStatus, confirmCheckoutSession } from "../lib/subscriptionSync";

const router = Router();

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

async function getUserEmail(clerkId: string): Promise<string> {
  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    return clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkId}@samesky.internal`;
  } catch {
    return `${clerkId}@samesky.internal`;
  }
}

// ─── GET /subscriptions/plans — public plan catalogue ─────────────────────────
router.get("/plans", (_req: Request, res: Response) => {
  res.json({
    plans: listPlans().map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceUsd: p.usdCents / 100,
      usdCents: p.usdCents,
      interval: p.interval,
      kind: p.kind,
      trialDays: p.trialDays,
      features: p.features,
      highlight: p.highlight ?? false,
    })),
  });
});

// ─── GET /subscriptions/me — current subscription status ──────────────────────
router.get("/me", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const status = await getSubscriptionStatus(user);
    res.json(status);
  } catch (err) {
    (req as any).log?.error({ err }, "Failed to load subscription status");
    res.status(500).json({ error: "Failed to load subscription status" });
  }
});

// ─── POST /subscriptions/checkout — start a checkout in local currency ────────
router.post("/checkout", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { plan: planId, currency } = req.body ?? {};
  const plan = getPlan(planId);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }
  const displayCurrency = typeof currency === "string" && /^[A-Za-z]{3}$/.test(currency) ? currency : "USD";

  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }

    const email = await getUserEmail(clerkId);
    const origin = getPublicOrigin(req);

    const result = await createCheckoutSession({
      user,
      email,
      plan,
      displayCurrency,
      successUrl: `${origin}/premium?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/premium?checkout=cancelled`,
    });

    res.json({
      url: result.url,
      chargeCurrency: result.chargeCurrency,
      requestedCurrency: result.requestedCurrency,
      fellBackToUsd: result.fellBackToUsd,
    });
  } catch (err) {
    (req as any).log?.error({ err }, "Subscription checkout error");
    res.status(500).json({ error: "Failed to start checkout" });
  }
});

// ─── POST /subscriptions/confirm — grant access on return from checkout ───────
router.post("/confirm", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { sessionId } = req.body ?? {};
  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const status = await confirmCheckoutSession(user, sessionId);
    res.json(status);
  } catch (err) {
    (req as any).log?.error({ err }, "Checkout confirmation error");
    res.status(400).json({ error: "Could not confirm checkout" });
  }
});

// ─── POST /subscriptions/portal — Stripe billing portal ───────────────────────
router.post("/portal", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: "No billing account yet" });
      return;
    }
    const url = await createPortalSession(user, `${getPublicOrigin(req)}/premium`);
    res.json({ url });
  } catch (err) {
    (req as any).log?.error({ err }, "Billing portal error");
    res.status(500).json({ error: "Failed to open billing portal" });
  }
});

// ─── POST /subscriptions/cancel — cancel at period end ────────────────────────
router.post("/cancel", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const result = await cancelSubscription(user);
    res.json({ ok: true, cancelAt: result.cancelAt });
  } catch (err) {
    (req as any).log?.error({ err }, "Subscription cancel error");
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to cancel" });
  }
});

// ─── POST /subscriptions/resume — undo a pending cancellation ─────────────────
router.post("/resume", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    await resumeSubscription(user);
    res.json({ ok: true });
  } catch (err) {
    (req as any).log?.error({ err }, "Subscription resume error");
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to resume" });
  }
});

// ─── POST /subscriptions/change — upgrade / downgrade recurring plan ──────────
router.post("/change", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { plan: planId } = req.body ?? {};
  if (!getPlan(planId)) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    await changePlan(user, planId);
    const status = await getSubscriptionStatus(user);
    res.json(status);
  } catch (err) {
    (req as any).log?.error({ err }, "Subscription change error");
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to change plan" });
  }
});

export default router;

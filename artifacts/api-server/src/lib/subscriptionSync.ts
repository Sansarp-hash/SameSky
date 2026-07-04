/**
 * Reconciles Stripe subscription truth onto our own users table so that
 * feature-gating (premiumStatus / role / expiry) always reflects reality.
 *
 * Recurring plans are read live from the Stripe API. Lifetime purchases have no
 * ongoing subscription, so they are marked with a far-future "sentinel" expiry
 * that reconciliation treats as permanent premium and never downgrades.
 */

import type Stripe from "stripe";
import { db, usersTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient";
import { findPrimarySubscription } from "./subscriptionService";
import { getPlan, PLANS, type PlanId, type LoyaltyBadge } from "./subscriptionPlans";
import { logger } from "./logger";

const LIFETIME_SENTINEL = new Date("3000-01-01T00:00:00.000Z");
const LIFETIME_THRESHOLD_MS = Date.parse("2999-01-01T00:00:00.000Z");

export function isLifetimeUser(user: Pick<User, "subscriptionExpiry">): boolean {
  return !!user.subscriptionExpiry && user.subscriptionExpiry.getTime() >= LIFETIME_THRESHOLD_MS;
}

export interface SubscriptionStatus {
  active: boolean;
  isLifetime: boolean;
  hasStripeCustomer: boolean;
  plan: PlanId | null;
  planName: string | null;
  status: string | null; // Stripe status, "lifetime", or null
  interval: "month" | "year" | null;
  currency: string | null;
  amountMinorUnits: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

function planFromSubscription(sub: Stripe.Subscription): PlanId | null {
  const interval = sub.items.data[0]?.price.recurring?.interval;
  const metaPlan = sub.metadata?.plan as PlanId | undefined;
  if (metaPlan && getPlan(metaPlan)) return metaPlan;
  if (interval === "month") return "premium_monthly";
  if (interval === "year") return "premium_yearly";
  return null;
}

async function applyUserPremium(
  user: User,
  premium: boolean,
  opts: { expiry?: Date | null; badge?: LoyaltyBadge } = {},
): Promise<void> {
  const set: Partial<typeof usersTable.$inferInsert> = { premiumStatus: premium };

  if (premium) {
    if (user.role === "free") set.role = "premium";
    if (opts.expiry !== undefined) set.subscriptionExpiry = opts.expiry;
    if (opts.badge) set.loyaltyBadge = opts.badge;
  } else {
    // Only demote a plain premium user — never touch admin/moderator/actress.
    if (user.role === "premium") set.role = "free";
  }

  await db.update(usersTable).set(set).where(eq(usersTable.id, user.id));
}

/** Read + reconcile the given user's subscription status. */
export async function getSubscriptionStatus(user: User): Promise<SubscriptionStatus> {
  const lifetime = isLifetimeUser(user);

  if (lifetime) {
    await applyUserPremium(user, true, { expiry: LIFETIME_SENTINEL, badge: PLANS.premium_lifetime.loyaltyBadge });
    return {
      active: true,
      isLifetime: true,
      hasStripeCustomer: !!user.stripeCustomerId,
      plan: "premium_lifetime",
      planName: PLANS.premium_lifetime.name,
      status: "lifetime",
      interval: null,
      currency: null,
      amountMinorUnits: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
    };
  }

  if (!user.stripeCustomerId) {
    await applyUserPremium(user, false);
    return {
      active: false,
      isLifetime: false,
      hasStripeCustomer: false,
      plan: null,
      planName: null,
      status: null,
      interval: null,
      currency: null,
      amountMinorUnits: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
    };
  }

  const stripe = await getUncachableStripeClient();
  const sub = await findPrimarySubscription(stripe, user.stripeCustomerId);

  if (!sub) {
    await applyUserPremium(user, false);
    return {
      active: false,
      isLifetime: false,
      hasStripeCustomer: true,
      plan: null,
      planName: null,
      status: null,
      interval: null,
      currency: null,
      amountMinorUnits: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
    };
  }

  const item = sub.items.data[0];
  const isPremium = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
  const planId = planFromSubscription(sub);
  const periodEndUnix =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (item as unknown as { current_period_end?: number } | undefined)?.current_period_end ??
    null;

  await applyUserPremium(user, isPremium, {
    expiry: periodEndUnix ? new Date(periodEndUnix * 1000) : null,
    badge: planId ? getPlan(planId)?.loyaltyBadge : undefined,
  });

  return {
    active: isPremium,
    isLifetime: false,
    hasStripeCustomer: true,
    plan: planId,
    planName: planId ? getPlan(planId)?.name ?? null : null,
    status: sub.status,
    interval: (item?.price.recurring?.interval as "month" | "year" | undefined) ?? null,
    currency: item?.price.currency ? item.price.currency.toUpperCase() : null,
    amountMinorUnits: item?.price.unit_amount ?? null,
    currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
  };
}

/** Reconcile by Stripe customer id (used from the webhook handler). */
export async function reconcileSubscriptionsForCustomer(customerId: string): Promise<void> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);
  if (!user) return;
  try {
    await getSubscriptionStatus(user);
  } catch (err) {
    logger.error({ err, customerId }, "Failed to reconcile subscription for customer");
  }
}

/**
 * Confirm a completed Checkout session on the user's return, granting premium
 * immediately (without waiting for the webhook). Verifies the session belongs
 * to this user before granting anything.
 */
export async function confirmCheckoutSession(user: User, sessionId: string): Promise<SubscriptionStatus> {
  const stripe = await getUncachableStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const sessionCustomer = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (sessionCustomer && user.stripeCustomerId && sessionCustomer !== user.stripeCustomerId) {
    throw new Error("Checkout session does not belong to this user");
  }
  if (session.metadata?.userId && session.metadata.userId !== String(user.id)) {
    throw new Error("Checkout session does not belong to this user");
  }

  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";

  if (session.mode === "payment" && session.metadata?.plan === "premium_lifetime" && paid) {
    await applyUserPremium(user, true, {
      expiry: LIFETIME_SENTINEL,
      badge: PLANS.premium_lifetime.loyaltyBadge,
    });
    const [fresh] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
    return getSubscriptionStatus(fresh ?? user);
  }

  // Subscription mode (or anything else) — reconcile against live Stripe state.
  const [fresh] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  return getSubscriptionStatus(fresh ?? user);
}

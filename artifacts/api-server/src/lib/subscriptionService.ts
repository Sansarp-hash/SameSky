/**
 * Stripe subscription operations for SameSky.
 *
 * All prices originate from the server-side catalogue (subscriptionPlans.ts)
 * and are converted to the user's local currency with live FX rates at request
 * time. The client never supplies an amount.
 */

import type Stripe from "stripe";
import { db, usersTable, platformConfigTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient";
import {
  getRate,
  convertUsdCents,
  resolveChargeCurrencyWithRate,
} from "./currency";
import { getPlan, type Plan } from "./subscriptionPlans";
import { logger } from "./logger";

const PRODUCT_CONFIG_KEY = "stripe_premium_product_id";

/** Get (or lazily create) the single "SameSky Premium" Stripe product id. */
async function getPremiumProductId(stripe: Stripe): Promise<string> {
  const [row] = await db
    .select()
    .from(platformConfigTable)
    .where(eq(platformConfigTable.key, PRODUCT_CONFIG_KEY))
    .limit(1);
  if (row?.value) return row.value;

  const product = await stripe.products.create({
    name: "SameSky Premium",
    description: "Premium membership for the SameSky Thai GL community.",
  });

  await db
    .insert(platformConfigTable)
    .values({ key: PRODUCT_CONFIG_KEY, value: product.id })
    .onConflictDoUpdate({ target: platformConfigTable.key, set: { value: product.id } });

  logger.info({ productId: product.id }, "Created Stripe premium product");
  return product.id;
}

/** Ensure the user has a Stripe customer, creating and persisting one if not. */
export async function getOrCreateCustomer(user: User, email: string): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = await getUncachableStripeClient();
  const customer = await stripe.customers.create({
    email,
    name: user.name ?? user.username,
    metadata: { userId: String(user.id), clerkId: user.clerkId },
  });

  await db
    .update(usersTable)
    .set({ stripeCustomerId: customer.id })
    .where(eq(usersTable.id, user.id));

  return customer.id;
}

export interface CheckoutResult {
  url: string;
  chargeCurrency: string;
  requestedCurrency: string;
  fellBackToUsd: boolean;
  amountMinorUnits: number;
}

/**
 * Create a Stripe Checkout session for a plan, charging in the user's local
 * currency (converted live). Recurring plans use subscription mode; lifetime
 * uses one-time payment mode. Amounts are computed server-side.
 */
export async function createCheckoutSession(params: {
  user: User;
  email: string;
  plan: Plan;
  displayCurrency: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  const { user, email, plan, displayCurrency, successUrl, cancelUrl } = params;
  const stripe = await getUncachableStripeClient();

  const { currency, rate, fellBack, requested } =
    await resolveChargeCurrencyWithRate(displayCurrency);
  const amountMinor = convertUsdCents(plan.usdCents, currency, rate);

  const customerId = await getOrCreateCustomer(user, email);
  const productId = await getPremiumProductId(stripe);

  const metadata: Record<string, string> = {
    userId: String(user.id),
    clerkId: user.clerkId,
    plan: plan.id,
    usd_cents: String(plan.usdCents),
    fx_rate: String(rate),
  };

  const commonPriceData = {
    currency: currency.toLowerCase(),
    product: productId,
    unit_amount: amountMinor,
  };

  let session: Stripe.Checkout.Session;

  if (plan.kind === "lifetime") {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ quantity: 1, price_data: commonPriceData }],
      payment_intent_data: { metadata },
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
  } else {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            ...commonPriceData,
            recurring: { interval: plan.interval as "month" | "year" },
          },
        },
      ],
      subscription_data: {
        metadata,
        ...(plan.trialDays > 0 ? { trial_period_days: plan.trialDays } : {}),
      },
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
  }

  if (!session.url) throw new Error("Stripe did not return a checkout URL");

  return {
    url: session.url,
    chargeCurrency: currency,
    requestedCurrency: requested,
    fellBackToUsd: fellBack,
    amountMinorUnits: amountMinor,
  };
}

/** Create a Stripe Billing Portal session (manage payment method / invoices). */
export async function createPortalSession(user: User, returnUrl: string): Promise<string> {
  if (!user.stripeCustomerId) throw new Error("No Stripe customer for user");
  const stripe = await getUncachableStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

/** Find the user's primary (active/trialing preferred) recurring subscription. */
export async function findPrimarySubscription(
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
    expand: ["data.items"],
  });
  if (subs.data.length === 0) return null;

  const rank = (s: Stripe.Subscription): number => {
    switch (s.status) {
      case "active":
      case "trialing":
        return 0;
      case "past_due":
      case "unpaid":
        return 1;
      case "canceled":
        return 3;
      default:
        return 2;
    }
  };
  return [...subs.data].sort((a, b) => rank(a) - rank(b) || b.created - a.created)[0] ?? null;
}

/** Cancel the user's subscription at the end of the current period. */
export async function cancelSubscription(user: User): Promise<{ cancelAt: number | null }> {
  if (!user.stripeCustomerId) throw new Error("No Stripe customer for user");
  const stripe = await getUncachableStripeClient();
  const sub = await findPrimarySubscription(stripe, user.stripeCustomerId);
  if (!sub || (sub.status !== "active" && sub.status !== "trialing")) {
    throw new Error("No active subscription to cancel");
  }
  const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
  return { cancelAt: updated.cancel_at ?? null };
}

/** Resume a subscription that was set to cancel at period end. */
export async function resumeSubscription(user: User): Promise<void> {
  if (!user.stripeCustomerId) throw new Error("No Stripe customer for user");
  const stripe = await getUncachableStripeClient();
  const sub = await findPrimarySubscription(stripe, user.stripeCustomerId);
  if (!sub) throw new Error("No subscription found");
  await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
}

/**
 * Upgrade or downgrade to another recurring plan. Keeps the subscription's
 * existing currency, converts the new plan's USD price into it, and updates the
 * item with proration so the customer is fairly credited/charged the difference.
 */
export async function changePlan(user: User, newPlanId: string): Promise<void> {
  const plan = getPlan(newPlanId);
  if (!plan || plan.kind !== "subscription" || !plan.interval) {
    throw new Error("Invalid target plan for change");
  }
  if (!user.stripeCustomerId) throw new Error("No Stripe customer for user");

  const stripe = await getUncachableStripeClient();
  const sub = await findPrimarySubscription(stripe, user.stripeCustomerId);
  if (!sub || (sub.status !== "active" && sub.status !== "trialing")) {
    throw new Error("No active subscription to change");
  }

  const item = sub.items.data[0];
  if (!item) throw new Error("Subscription has no items");

  const currency = (item.price.currency ?? "usd").toUpperCase();
  const rate = await getRate(currency);
  const amountMinor = convertUsdCents(plan.usdCents, currency, rate);
  const productId = await getPremiumProductId(stripe);

  const price = await stripe.prices.create({
    currency: currency.toLowerCase(),
    product: productId,
    unit_amount: amountMinor,
    recurring: { interval: plan.interval },
  });

  await stripe.subscriptions.update(sub.id, {
    items: [{ id: item.id, price: price.id }],
    proration_behavior: "create_prorations",
    cancel_at_period_end: false,
    metadata: { ...sub.metadata, plan: plan.id, usd_cents: String(plan.usdCents) },
  });
}

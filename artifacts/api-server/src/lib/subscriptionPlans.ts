/**
 * Server-side subscription plan catalogue — the single source of truth for
 * pricing. Prices are defined in USD cents here and NEVER accepted from the
 * client, which prevents price tampering: the client only sends a plan id, the
 * server looks up the real price and converts it to the charge currency.
 */

import type { loyaltyBadgeEnum } from "@workspace/db";

export type PlanId = "premium_monthly" | "premium_yearly" | "premium_lifetime";
export type PlanInterval = "month" | "year" | null;
export type LoyaltyBadge = (typeof loyaltyBadgeEnum.enumValues)[number];

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  usdCents: number;
  interval: PlanInterval; // null = one-time (lifetime)
  kind: "subscription" | "lifetime";
  trialDays: number; // 0 = no trial
  loyaltyBadge: LoyaltyBadge;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  premium_monthly: {
    id: "premium_monthly",
    name: "Premium Monthly",
    description: "Full access to every SameSky feature, billed monthly.",
    usdCents: 500,
    interval: "month",
    kind: "subscription",
    trialDays: 7,
    loyaltyBadge: "gl_supporter",
    features: [
      "Ad-free experience",
      "Unlimited watchlist & ship tracking",
      "Premium-only community drops",
      "Priority access to new series",
      "Premium supporter badge",
    ],
  },
  premium_yearly: {
    id: "premium_yearly",
    name: "Premium Yearly",
    description: "Everything in Premium, billed yearly — best value (save 20%).",
    usdCents: 4800,
    interval: "year",
    kind: "subscription",
    trialDays: 7,
    loyaltyBadge: "loyal_fan",
    features: [
      "Everything in Premium Monthly",
      "Two months free vs monthly",
      "Loyal fan badge",
      "Early-bird event invites",
    ],
    highlight: true,
  },
  premium_lifetime: {
    id: "premium_lifetime",
    name: "Lifetime",
    description: "Pay once, stay Premium forever.",
    usdCents: 14900,
    interval: null,
    kind: "lifetime",
    trialDays: 0,
    loyaltyBadge: "gl_legend",
    features: [
      "Everything in Premium, forever",
      "One-time payment, no renewals",
      "Exclusive GL Legend badge",
      "Founding supporter recognition",
    ],
  },
};

export function getPlan(id: string): Plan | undefined {
  return (PLANS as Record<string, Plan>)[id];
}

export function listPlans(): Plan[] {
  return [PLANS.premium_monthly, PLANS.premium_yearly, PLANS.premium_lifetime];
}

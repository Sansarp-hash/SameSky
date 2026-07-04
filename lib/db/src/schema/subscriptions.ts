import { pgTable, text, serial, integer, timestamp, boolean, numeric, pgEnum, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";
import { loyaltyBadgeEnum } from "./users";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "unpaid",
]);

export const subscriptionConfigTable = pgTable(
  "subscription_config",
  {
    id: serial("id").primaryKey(),
    durationMonths: integer("duration_months").notNull().unique(),
    priceUsd: numeric("price_usd", { precision: 10, scale: 2 }).notNull(),
    bonusCoins: integer("bonus_coins").notNull().default(0),
    loyaltyBadgeName: loyaltyBadgeEnum("loyalty_badge_name").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    check("duration_months_range", sql`${t.durationMonths} >= 1 AND ${t.durationMonths} <= 12`),
  ]
);

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  termMonths: integer("term_months").notNull(),
  loyaltyBadge: loyaltyBadgeEnum("loyalty_badge"),
  bonusCoinsAwarded: integer("bonus_coins_awarded").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSessionId: text("stripe_session_id"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  autoRenew: boolean("auto_renew").notNull().default(true),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coinPurchasesTable = pgTable("coin_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  packSize: integer("pack_size").notNull(),
  pricePaid: numeric("price_paid", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformConfigTable = pgTable("platform_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type SubscriptionConfig = typeof subscriptionConfigTable.$inferSelect;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type CoinPurchase = typeof coinPurchasesTable.$inferSelect;
export type PlatformConfig = typeof platformConfigTable.$inferSelect;

import { pgTable, serial, timestamp, jsonb, integer, numeric, bigint } from "drizzle-orm/pg-core";

export const platformAnalyticsSnapshotsTable = pgTable("platform_analytics_snapshots", {
  id: serial("id").primaryKey(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  activeUsersByCountry: jsonb("active_users_by_country").notNull().default({}),
  subscriptionCountsByDuration: jsonb("subscription_counts_by_duration").notNull().default({}),
  raffleCoinsEntryVolumes: jsonb("raffle_coin_entry_volumes").notNull().default({}),
  aiRejectionStats: jsonb("ai_rejection_stats").notNull().default({}),
  dmVolumeCount: bigint("dm_volume_count", { mode: "number" }).notNull().default(0),
  totalFulfillmentCostsUsd: numeric("total_fulfillment_costs_usd", { precision: 14, scale: 2 }).notNull().default("0"),

  // Super admin real-time telemetry fields
  viewersCount: integer("viewers_count").notNull().default(0),
  coinTransactionsTotal: bigint("coin_transactions_total", { mode: "number" }).notNull().default(0),
  topGiftersList: jsonb("top_gifters_list").notNull().default([]),
  actressEarningsAggregate: numeric("actress_earnings_aggregate", { precision: 14, scale: 2 }).notNull().default("0"),
  merchOrdersPending: integer("merch_orders_pending").notNull().default(0),
  ticketWinnersByCountryCode: jsonb("ticket_winners_by_country_code").notNull().default({}),
  blockMuteRatesPercentage: numeric("block_mute_rates_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
});

export type PlatformAnalyticsSnapshot = typeof platformAnalyticsSnapshotsTable.$inferSelect;

import {
  pgTable, text, serial, integer, timestamp, boolean, numeric, jsonb, bigint, pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { actressProfilesTable } from "./actress_profiles";
import { liveStreamsTable } from "./live_streams";

export const raffleApprovalStatusEnum = pgEnum("raffle_approval_status", [
  "draft",
  "pending_actress_approval",
  "live",
  "drawing",
  "completed",
  "rejected",
  "cancelled",
]);

export const itemTypeEnum = pgEnum("item_type", ["clothing", "accessory", "gl_drama_prop"]);

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "pending",
  "design_in_progress",
  "produced",
  "shipped",
  "delivered",
]);

export const personalItemFulfillmentEnum = pgEnum("personal_item_fulfillment", [
  "pending",
  "shipped",
  "delivered",
]);

export const fanMeetTicketRaffleStatusEnum = pgEnum("fan_meet_ticket_raffle_status", [
  "draft",
  "live",
  "drawing",
  "completed",
  "cancelled",
]);

// --- Design Directive Raffle ---

export const designDirectiveRafflesTable = pgTable("design_directive_raffles", {
  id: serial("id").primaryKey(),
  actressId: integer("actress_id").notNull().references(() => actressProfilesTable.id, { onDelete: "cascade" }),
  brandName: text("brand_name").notNull(),
  merchType: text("merch_type").notNull(),
  designBrief: text("design_brief").notNull(),
  designOptions: jsonb("design_options").notNull().default([]),
  proposedLiveSessionDateRange: text("proposed_live_session_date_range"),
  coinCostPerPaidEntry: integer("coin_cost_per_paid_entry").notNull(),
  opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  status: raffleApprovalStatusEnum("status").notNull().default("draft"),
  actressApprovalNote: text("actress_approval_note"),
  winnerUserId: integer("winner_user_id").references(() => usersTable.id),
  winnerNotifiedOfOptions: boolean("winner_notified_of_options").notNull().default(false),
  winnerChosenOption: text("winner_chosen_option"),
  liveStreamId: integer("live_stream_id").references(() => liveStreamsTable.id),
  sessionCancelled: boolean("session_cancelled").notNull().default(false),
  sessionResolutionNotes: text("session_resolution_notes"),
  fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull().default("pending"),
  winnerShippingAddressEncrypted: text("winner_shipping_address_encrypted"),
  productionCostUsd: numeric("production_cost_usd", { precision: 10, scale: 2 }),
  postSessionDesignPhotoUrl: text("post_session_design_photo_url"),
  isOneOfAKind: boolean("is_one_of_a_kind").notNull().default(true),
  totalEntries: bigint("total_entries", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const designDirectiveRaffleEntriesTable = pgTable("design_directive_raffle_entries", {
  id: serial("id").primaryKey(),
  raffleId: integer("raffle_id").notNull().references(() => designDirectiveRafflesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  isFreeEntry: boolean("is_free_entry").notNull().default(false),
  paidEntriesCount: integer("paid_entries_count").notNull().default(0),
  coinsSpent: integer("coins_spent").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Personal Item Raffle ---

export const personalItemRafflesTable = pgTable("personal_item_raffles", {
  id: serial("id").primaryKey(),
  actressId: integer("actress_id").notNull().references(() => actressProfilesTable.id, { onDelete: "cascade" }),
  itemType: itemTypeEnum("item_type").notNull(),
  itemName: text("item_name").notNull(),
  itemDescription: text("item_description"),
  itemPhotos: text("item_photos").array().notNull().default([]),
  estimatedRealValueUsd: numeric("estimated_real_value_usd", { precision: 10, scale: 2 }),
  liveWearSessionDate: timestamp("live_wear_session_date", { withTimezone: true }),
  coinCostPerPaidEntry: integer("coin_cost_per_paid_entry").notNull(),
  opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  status: raffleApprovalStatusEnum("status").notNull().default("draft"),
  actressApprovalNote: text("actress_approval_note"),
  totalEntries: bigint("total_entries", { mode: "number" }).notNull().default(0),
  winnerUserId: integer("winner_user_id").references(() => usersTable.id),
  liveStreamId: integer("live_stream_id").references(() => liveStreamsTable.id),
  sessionCancelled: boolean("session_cancelled").notNull().default(false),
  sessionResolutionNotes: text("session_resolution_notes"),
  fulfillmentStatus: personalItemFulfillmentEnum("fulfillment_status").notNull().default("pending"),
  winnerShippingAddressEncrypted: text("winner_shipping_address_encrypted"),
  platformCostUsd: numeric("platform_cost_usd", { precision: 10, scale: 2 }),
  postSessionCelebrationPhotoUrl: text("post_session_celebration_photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const personalItemRaffleEntriesTable = pgTable("personal_item_raffle_entries", {
  id: serial("id").primaryKey(),
  raffleId: integer("raffle_id").notNull().references(() => personalItemRafflesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  isFreeEntry: boolean("is_free_entry").notNull().default(false),
  paidEntriesCount: integer("paid_entries_count").notNull().default(0),
  coinsSpent: integer("coins_spent").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Fan Meet Ticket Raffle ---

export const fanMeetTicketRafflesTable = pgTable("fan_meet_ticket_raffles", {
  id: serial("id").primaryKey(),
  actressId: integer("actress_id").notNull().references(() => actressProfilesTable.id, { onDelete: "cascade" }),
  eventName: text("event_name").notNull(),
  eventCountry: text("event_country").notNull(),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  officialTicketPriceUsd: numeric("official_ticket_price_usd", { precision: 10, scale: 2 }).notNull(),
  platformCostUsd: numeric("platform_cost_usd", { precision: 10, scale: 2 }),
  partnerEventUrl: text("partner_event_url"),
  digitalTicketCode: text("digital_ticket_code"),
  coinCostPerEntry: integer("coin_cost_per_entry").notNull(),
  opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  status: fanMeetTicketRaffleStatusEnum("status").notNull().default("draft"),
  totalEntries: bigint("total_entries", { mode: "number" }).notNull().default(0),
  winnerUserId: integer("winner_user_id").references(() => usersTable.id),
  ticketDelivered: boolean("ticket_delivered").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fanMeetTicketRaffleEntriesTable = pgTable("fan_meet_ticket_raffle_entries", {
  id: serial("id").primaryKey(),
  raffleId: integer("raffle_id").notNull().references(() => fanMeetTicketRafflesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  isFreeEntry: boolean("is_free_entry").notNull().default(false),
  paidEntriesCount: integer("paid_entries_count").notNull().default(0),
  coinsSpent: integer("coins_spent").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Merch Raffle (simple) ---

export const merchRafflesTable = pgTable("merch_raffles", {
  id: serial("id").primaryKey(),
  actressId: integer("actress_id").notNull().references(() => actressProfilesTable.id, { onDelete: "cascade" }),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  itemDescription: text("item_description").notNull(),
  imageUrl: text("image_url"),
  coinCostPerEntry: integer("coin_cost_per_entry").notNull(),
  opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  status: fanMeetTicketRaffleStatusEnum("status").notNull().default("draft"),
  totalEntries: bigint("total_entries", { mode: "number" }).notNull().default(0),
  winnerUserId: integer("winner_user_id").references(() => usersTable.id),
  fulfillmentStatus: personalItemFulfillmentEnum("fulfillment_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const merchRaffleEntriesTable = pgTable("merch_raffle_entries", {
  id: serial("id").primaryKey(),
  raffleId: integer("raffle_id").notNull().references(() => merchRafflesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  isFreeEntry: boolean("is_free_entry").notNull().default(false),
  paidEntriesCount: integer("paid_entries_count").notNull().default(0),
  coinsSpent: integer("coins_spent").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DesignDirectiveRaffle = typeof designDirectiveRafflesTable.$inferSelect;
export type PersonalItemRaffle = typeof personalItemRafflesTable.$inferSelect;
export type FanMeetTicketRaffle = typeof fanMeetTicketRafflesTable.$inferSelect;
export type MerchRaffle = typeof merchRafflesTable.$inferSelect;

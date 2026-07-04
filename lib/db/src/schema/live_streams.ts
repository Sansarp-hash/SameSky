import { pgTable, text, serial, integer, timestamp, bigint, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { actressProfilesTable } from "./actress_profiles";

export const streamTypeEnum = pgEnum("stream_type", [
  "regular",
  "fan_letter_raffle",
  "design_directive",
  "personal_item",
]);

export const streamStatusEnum = pgEnum("stream_status", [
  "scheduled",
  "live",
  "ended",
  "disconnected",
]);

export const streamOverlayBadgeEnum = pgEnum("stream_overlay_badge", [
  "none",
  "design_directive_live",
  "personal_item_live",
]);

export const raffleTypeRefEnum = pgEnum("raffle_type_ref", [
  "none",
  "fan_letter",
  "design_directive",
  "personal_item",
]);

export const liveStreamsTable = pgTable("live_streams", {
  id: serial("id").primaryKey(),
  actressId: integer("actress_id").notNull().references(() => actressProfilesTable.id, { onDelete: "cascade" }),
  raffleRef: integer("raffle_ref"),
  raffleType: raffleTypeRefEnum("raffle_type").notNull().default("none"),
  streamType: streamTypeEnum("stream_type").notNull().default("regular"),
  overlayBadge: streamOverlayBadgeEnum("overlay_badge").notNull().default("none"),
  title: text("title").notNull(),
  vodUrl: text("vod_url"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  status: streamStatusEnum("status").notNull().default("scheduled"),
  viewerCount: bigint("viewer_count", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const streamChatMessagesTable = pgTable("stream_chat_messages", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").notNull().references(() => liveStreamsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const virtualGiftLogTable = pgTable("virtual_gift_log", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").notNull().references(() => liveStreamsTable.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull(),
  actressId: integer("actress_id").notNull().references(() => actressProfilesTable.id, { onDelete: "cascade" }),
  giftType: text("gift_type").notNull(),
  coinCost: integer("coin_cost").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const withdrawalRequestsTable = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  actressId: integer("actress_id").notNull().references(() => actressProfilesTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  payoutMethod: text("payout_method").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLiveStreamSchema = createInsertSchema(liveStreamsTable).omit({
  id: true,
  vodUrl: true,
  startedAt: true,
  endedAt: true,
  viewerCount: true,
  createdAt: true,
});
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type LiveStream = typeof liveStreamsTable.$inferSelect;

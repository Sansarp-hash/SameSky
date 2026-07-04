import { pgTable, text, serial, integer, timestamp, unique, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const userBlocksTable = pgTable(
  "user_blocks",
  {
    id: serial("id").primaryKey(),
    blockerId: integer("blocker_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    blockedId: integer("blocked_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.blockerId, t.blockedId)]
);

export const userMutesTable = pgTable(
  "user_mutes",
  {
    id: serial("id").primaryKey(),
    muterId: integer("muter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    mutedId: integer("muted_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.muterId, t.mutedId)]
);

export const strikeContentTypeEnum = pgEnum("strike_content_type", ["post", "fan_art"]);

export const contentStrikesTable = pgTable("content_strikes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  contentType: strikeContentTypeEnum("content_type").notNull(),
  contentExcerpt: text("content_excerpt"),
  detectionScore: text("detection_score"),
  action: text("action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const followNotificationPrefsTable = pgTable(
  "follow_notification_prefs",
  {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: integer("following_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    onLive: integer("on_live").notNull().default(1),
    onRaffle: integer("on_raffle").notNull().default(1),
    onPost: integer("on_post").notNull().default(1),
    onFanLetterPool: integer("on_fan_letter_pool").notNull().default(1),
    onLiveEvent: integer("on_live_event").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [unique().on(t.followerId, t.followingId)]
);

export type UserBlock = typeof userBlocksTable.$inferSelect;
export type UserMute = typeof userMutesTable.$inferSelect;
export type ContentStrike = typeof contentStrikesTable.$inferSelect;
export type FollowNotificationPrefs = typeof followNotificationPrefsTable.$inferSelect;

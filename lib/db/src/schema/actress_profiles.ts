import { pgTable, text, serial, timestamp, boolean, integer, jsonb, bigint, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const actressTypeEnum = pgEnum("actress_type", ["official", "verified_creator"]);

export const actressProfilesTable = pgTable("actress_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  type: actressTypeEnum("type").notNull().default("verified_creator"),
  displayName: text("display_name").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  nationality: text("nationality"),
  careerTimeline: jsonb("career_timeline").notNull().default([]),
  roles: jsonb("roles").notNull().default([]),
  awards: text("awards").array().notNull().default([]),
  upcomingProjects: text("upcoming_projects").array().notNull().default([]),
  socialHandles: jsonb("social_handles").notNull().default({}),
  affiliatedContentIds: integer("affiliated_content_ids").array().notNull().default([]),
  ambassadorBrands: text("ambassador_brands").array().notNull().default([]),
  fanLetterPoolOpen: boolean("fan_letter_pool_open").notNull().default(false),
  liveStreamEnabled: boolean("live_stream_enabled").notNull().default(false),
  totalCoinsEarned: bigint("total_coins_earned", { mode: "number" }).notNull().default(0),
  pendingWithdrawalBalance: numeric("pending_withdrawal_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  followerCount: bigint("follower_count", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertActressProfileSchema = createInsertSchema(actressProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertActressProfile = z.infer<typeof insertActressProfileSchema>;
export type ActressProfile = typeof actressProfilesTable.$inferSelect;

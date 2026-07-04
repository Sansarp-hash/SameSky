import { pgTable, text, serial, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loyaltyBadgeEnum = pgEnum("loyalty_badge", [
  "gl_fan",
  "gl_supporter",
  "loyal_fan",
  "gl_legend",
]);

export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "public",
  "private",
]);

export const contentTierEnum = pgEnum("content_tier", [
  "no_media_access",
  "sfw_only",
  "mature",
  "explicit_eligible",
]);

export const userRoleEnum = pgEnum("user_role", [
  "free",
  "premium",
  "moderator",
  "actress",
  "admin",
  "super_admin",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  username: text("username").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  country: text("country"),
  preferredLanguage: text("preferred_language").default("en"),
  currencyPreference: text("currency_preference"),
  stripeCustomerId: text("stripe_customer_id"),
  socialLinks: jsonb("social_links").default({}),

  role: userRoleEnum("role").notNull().default("free"),
  profileVisibility: profileVisibilityEnum("profile_visibility").notNull().default("public"),

  coinBalance: integer("coin_balance").notNull().default(0),

  dob: timestamp("dob", { withTimezone: true }),
  ageVerified: boolean("age_verified").notNull().default(false),
  adultVerified: boolean("adult_verified").notNull().default(false),
  contentTier: contentTierEnum("content_tier").notNull().default("no_media_access"),
  emailVerified: boolean("email_verified").notNull().default(false),

  premiumStatus: boolean("premium_status").notNull().default(false),
  subscriptionExpiry: timestamp("subscription_expiry", { withTimezone: true }),
  subscriptionDurationMonths: integer("subscription_duration_months"),
  loyaltyBadge: loyaltyBadgeEnum("loyalty_badge"),

  isVerified: boolean("is_verified").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspendedUntil: timestamp("suspended_until", { withTimezone: true }),
  banReason: text("ban_reason"),
  aiViolationStrikes: integer("ai_violation_strikes").notNull().default(0),
  fanArtUploadBanned: boolean("fan_art_upload_banned").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

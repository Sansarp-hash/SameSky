import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";

// ─── Enums ─────────────────────────────────────────────────────────────────

export const fmSubscriptionTierEnum = pgEnum("fm_subscription_tier", [
  "free",
  "premium",
]);

export const fmEmotionalStatusEnum = pgEnum("fm_emotional_status", [
  "loved",
  "liked",
  "somehow",
  "really",
]);

export const fmFlagTypeEnum = pgEnum("fm_flag_type", [
  "red",
  "yellow",
  "green",
  "forest",
  "magma",
]);

export const fmReadingTypeEnum = pgEnum("fm_reading_type", [
  "daily",
  "love",
  "career",
]);

// ─── Users (bridged to Clerk via clerk_id) ──────────────────────────────────

export const fmUsersTable = pgTable("fm_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  subscriptionTier: fmSubscriptionTierEnum("subscription_tier")
    .notNull()
    .default("free"),
  clerkId: text("clerk_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Ships ─────────────────────────────────────────────────────────────────

export const fmShipsTable = pgTable("fm_ships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => fmUsersTable.id, { onDelete: "cascade" }),
  shipName: text("ship_name").notNull(),
  rankPosition: integer("rank_position").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Actresses ─────────────────────────────────────────────────────────────

export const fmActressesTable = pgTable("fm_actresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => fmUsersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  rankPosition: integer("rank_position").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Series ─────────────────────────────────────────────────────────────────

export const fmSeriesTable = pgTable("fm_series", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => fmUsersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: fmEmotionalStatusEnum("status").notNull().default("liked"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Characters ──────────────────────────────────────────────────────────────

export const fmCharactersTable = pgTable("fm_characters", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id")
    .notNull()
    .references(() => fmSeriesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  flagType: fmFlagTypeEnum("flag_type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Tarot Readings ───────────────────────────────────────────────────────────

export const fmTarotReadingsTable = pgTable("fm_tarot_readings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => fmUsersTable.id, { onDelete: "cascade" }),
  cards: jsonb("cards").notNull().default([]),
  readingType: fmReadingTypeEnum("reading_type").notNull().default("daily"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Astrology Profiles ────────────────────────────────────────────────────────

export const fmAstrologyProfilesTable = pgTable("fm_astrology_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => fmUsersTable.id, { onDelete: "cascade" }),
  birthDate: date("birth_date").notNull(),
  birthTime: text("birth_time"),
  birthLocation: text("birth_location"),
  zodiacSign: text("zodiac_sign").notNull(),
  element: text("element").notNull(),
  rulingPlanet: text("ruling_planet").notNull(),
  profileData: jsonb("profile_data").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Inferred types ────────────────────────────────────────────────────────────

export type FMUser = typeof fmUsersTable.$inferSelect;
export type FMShip = typeof fmShipsTable.$inferSelect;
export type FMActor = typeof fmActressesTable.$inferSelect;
export type FMSeries = typeof fmSeriesTable.$inferSelect;
export type FMCharacter = typeof fmCharactersTable.$inferSelect;
export type FMTarotReading = typeof fmTarotReadingsTable.$inferSelect;
export type FMAstrologyProfile = typeof fmAstrologyProfilesTable.$inferSelect;

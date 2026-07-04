import { pgTable, text, serial, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { actressProfilesTable } from "./actress_profiles";

export const careerListingTypeEnum = pgEnum("career_listing_type", [
  "casting_call",
  "audition",
  "screenwriting",
  "production_crew",
]);

export const careerListingStatusEnum = pgEnum("career_listing_status", ["open", "closed"]);

export const applicationStatusEnum = pgEnum("application_status", [
  "submitted",
  "reviewed",
  "accepted",
  "rejected",
]);

export const creatorApplicationStatusEnum = pgEnum("creator_application_status", [
  "pending",
  "approved",
  "rejected",
]);

export const careerListingsTable = pgTable("career_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: careerListingTypeEnum("type").notNull(),
  description: text("description").notNull(),
  postedById: integer("posted_by_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  actressId: integer("actress_id").references(() => actressProfilesTable.id, { onDelete: "set null" }),
  applicationDeadline: timestamp("application_deadline", { withTimezone: true }),
  status: careerListingStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const careerApplicationsTable = pgTable("career_applications", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => careerListingsTable.id, { onDelete: "cascade" }),
  applicantId: integer("applicant_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  coverLetter: text("cover_letter").notNull(),
  portfolioUrl: text("portfolio_url"),
  status: applicationStatusEnum("status").notNull().default("submitted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creatorApplicationsTable = pgTable("creator_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  portfolioUrl: text("portfolio_url"),
  socialHandles: jsonb("social_handles").notNull().default({}),
  statement: text("statement").notNull(),
  status: creatorApplicationStatusEnum("status").notNull().default("pending"),
  reviewedById: integer("reviewed_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const insertCareerListingSchema = createInsertSchema(careerListingsTable).omit({
  id: true,
  createdAt: true,
});
export const insertCareerApplicationSchema = createInsertSchema(careerApplicationsTable).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type CareerListing = typeof careerListingsTable.$inferSelect;
export type CareerApplication = typeof careerApplicationsTable.$inferSelect;
export type CreatorApplication = typeof creatorApplicationsTable.$inferSelect;

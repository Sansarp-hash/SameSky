import { pgTable, text, serial, integer, timestamp, unique, pgEnum, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";
import { contentEntriesTable } from "./content_entries";

export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);

export const reviewsTable = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    contentId: integer("content_id").notNull().references(() => contentEntriesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    starRating: integer("star_rating").notNull(),
    textBody: text("text_body"),
    status: reviewStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    unique().on(t.userId, t.contentId),
    check("star_rating_range", sql`${t.starRating} >= 1 AND ${t.starRating} <= 5`),
  ]
);

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;

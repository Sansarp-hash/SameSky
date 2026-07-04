import { pgTable, text, serial, integer, timestamp, bigint, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { contentEntriesTable } from "./content_entries";
import { contentRatingEnum } from "./content_entries";

export const fanArtStatusEnum = pgEnum("fan_art_status", ["pending", "approved", "ai_rejected", "rejected"]);

export const fanArtTable = pgTable("fan_art", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").references(() => contentEntriesTable.id, { onDelete: "set null" }),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  contentRating: contentRatingEnum("content_rating").notNull().default("sfw"),
  likesCount: bigint("likes_count", { mode: "number" }).notNull().default(0),
  status: fanArtStatusEnum("status").notNull().default("pending"),
  aiDetectionResult: jsonb("ai_detection_result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFanArtSchema = createInsertSchema(fanArtTable).omit({
  id: true,
  likesCount: true,
  status: true,
  aiDetectionResult: true,
  createdAt: true,
});
export type InsertFanArt = z.infer<typeof insertFanArtSchema>;
export type FanArt = typeof fanArtTable.$inferSelect;

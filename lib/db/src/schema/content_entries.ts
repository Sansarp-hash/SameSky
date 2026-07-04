import { pgTable, text, serial, timestamp, integer, jsonb, real, bigint, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const contentTypeEnum = pgEnum("content_type", ["series", "movie", "short_drama", "novel", "ship"]);
export const contentRatingEnum = pgEnum("content_rating", ["sfw", "mature", "explicit"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "published", "archived"]);

export const contentEntriesTable = pgTable("content_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: contentTypeEnum("type").notNull(),
  country: text("country").notNull(),
  year: integer("year"),
  genres: text("genres").array().notNull().default([]),
  synopsis: text("synopsis"),
  coverImageUrl: text("cover_image_url"),
  trailerUrl: text("trailer_url"),
  contentRating: contentRatingEnum("content_rating").notNull().default("sfw"),
  streamingLinks: jsonb("streaming_links").notNull().default([]),
  cast: jsonb("cast").notNull().default([]),
  shipProfiles: jsonb("ship_profiles").notNull().default([]),
  episodeList: jsonb("episode_list").notNull().default([]),
  trivia: text("trivia").array().notNull().default([]),
  awards: text("awards").array().notNull().default([]),
  fanRatingAvg: real("fan_rating_avg").notNull().default(0),
  starRatingCount: bigint("star_rating_count", { mode: "number" }).notNull().default(0),
  status: contentStatusEnum("status").notNull().default("draft"),
  submittedBy: integer("submitted_by").references(() => usersTable.id, { onDelete: "set null" }),
  isFeatured: boolean("is_featured").notNull().default(false),
  relatedContentIds: integer("related_content_ids").array().notNull().default([]),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContentEntrySchema = createInsertSchema(contentEntriesTable).omit({
  id: true,
  fanRatingAvg: true,
  starRatingCount: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContentEntry = z.infer<typeof insertContentEntrySchema>;
export type ContentEntry = typeof contentEntriesTable.$inferSelect;

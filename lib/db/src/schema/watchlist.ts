import { pgTable, serial, integer, timestamp, unique, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { contentEntriesTable } from "./content_entries";

export const watchlistStatusEnum = pgEnum("watchlist_status", [
  "want_to_watch",
  "watching",
  "completed",
  "dropped",
]);

export const watchlistEntriesTable = pgTable(
  "watchlist_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    contentId: integer("content_id").notNull().references(() => contentEntriesTable.id, { onDelete: "cascade" }),
    status: watchlistStatusEnum("status").notNull().default("want_to_watch"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.contentId)]
);

export const insertWatchlistEntrySchema = createInsertSchema(watchlistEntriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWatchlistEntry = z.infer<typeof insertWatchlistEntrySchema>;
export type WatchlistEntry = typeof watchlistEntriesTable.$inferSelect;

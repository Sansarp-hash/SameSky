import { pgTable, serial, integer, timestamp, unique, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const followsTable = pgTable(
  "follows",
  {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: integer("following_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    notificationPrefs: jsonb("notification_prefs").notNull().default({
      goes_live: true,
      creates_raffle: true,
      posts: true,
      opens_fan_letter_pool: true,
      announces_event: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.followerId, t.followingId)]
);

export type Follow = typeof followsTable.$inferSelect;

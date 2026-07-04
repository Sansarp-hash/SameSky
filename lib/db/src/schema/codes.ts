import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const communityCodesTable = pgTable("community_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  contributor: text("contributor"),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  claimed: boolean("claimed").notNull().default(false),
  claimedByUserId: integer("claimed_by_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommunityCodeSchema = createInsertSchema(communityCodesTable).omit({
  id: true,
  claimed: true,
  claimedByUserId: true,
  claimedAt: true,
  createdAt: true,
});
export type InsertCommunityCode = z.infer<typeof insertCommunityCodeSchema>;
export type CommunityCode = typeof communityCodesTable.$inferSelect;

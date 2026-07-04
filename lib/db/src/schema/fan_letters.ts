import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { actressProfilesTable } from "./actress_profiles";

export const fanLetterPoolStatusEnum = pgEnum("fan_letter_pool_status", [
  "active_in_pool",
  "drawn_winner",
  "archived",
]);

export const fanLettersTable = pgTable("fan_letters", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  actressId: integer("actress_id").notNull().references(() => actressProfilesTable.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  poolStatus: fanLetterPoolStatusEnum("pool_status").notNull().default("active_in_pool"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFanLetterSchema = createInsertSchema(fanLettersTable).omit({
  id: true,
  poolStatus: true,
  createdAt: true,
});
export type InsertFanLetter = z.infer<typeof insertFanLetterSchema>;
export type FanLetter = typeof fanLettersTable.$inferSelect;

import { pgTable, text, serial, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const rafflesTable = pgTable("raffles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  prize: text("prize"),
  entryCost: integer("entry_cost").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("upcoming"),
  entryCount: integer("entry_count").notNull().default(0),
  winnerId: integer("winner_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const raffleEntriesTable = pgTable(
  "raffle_entries",
  {
    id: serial("id").primaryKey(),
    raffleId: integer("raffle_id").notNull().references(() => rafflesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("raffle_entries_raffle_id_idx").on(t.raffleId),
    index("raffle_entries_user_id_idx").on(t.userId),
    uniqueIndex("raffle_entries_raffle_user_unique").on(t.raffleId, t.userId),
  ],
);

export const insertRaffleSchema = createInsertSchema(rafflesTable).omit({
  id: true,
  status: true,
  entryCount: true,
  winnerId: true,
  createdAt: true,
});

export type InsertRaffle = z.infer<typeof insertRaffleSchema>;
export type Raffle = typeof rafflesTable.$inferSelect;
export type RaffleEntry = typeof raffleEntriesTable.$inferSelect;

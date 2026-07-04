import { pgTable, text, serial, integer, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const dmThreadsTable = pgTable(
  "dm_threads",
  {
    id: serial("id").primaryKey(),
    participantAId: integer("participant_a_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    participantBId: integer("participant_b_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.participantAId, t.participantBId)]
);

export const dmMessagesTable = pgTable("dm_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => dmThreadsTable.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  readStatus: boolean("read_status").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDmMessageSchema = createInsertSchema(dmMessagesTable).omit({
  id: true,
  readStatus: true,
  deletedAt: true,
  createdAt: true,
});
export type InsertDmMessage = z.infer<typeof insertDmMessageSchema>;
export type DmThread = typeof dmThreadsTable.$inferSelect;
export type DmMessage = typeof dmMessagesTable.$inferSelect;

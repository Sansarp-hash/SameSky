import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const reportTargetTypeEnum = pgEnum("report_target_type", [
  "user",
  "post",
  "comment",
  "fan_art",
  "direct_message",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "under_review",
  "resolved_no_action",
  "resolved_action_taken",
]);

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  reportedTargetId: integer("reported_target_id").notNull(),
  targetType: reportTargetTypeEnum("target_type").notNull(),
  reason: text("reason").notNull(),
  status: reportStatusEnum("status").notNull().default("open"),
  resolvedById: integer("resolved_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  status: true,
  resolvedById: true,
  resolvedAt: true,
  createdAt: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;

import { pgTable, text, serial, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const contentSubmissionStatusEnum = pgEnum("content_submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const contentSubmissionsTable = pgTable("content_submissions", {
  id: serial("id").primaryKey(),
  submitterId: integer("submitter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  proposedData: jsonb("proposed_data").notNull().default({}),
  status: contentSubmissionStatusEnum("status").notNull().default("pending"),
  moderatorNote: text("moderator_note"),
  reviewedById: integer("reviewed_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const insertContentSubmissionSchema = createInsertSchema(contentSubmissionsTable).omit({
  id: true,
  status: true,
  moderatorNote: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true,
});
export type InsertContentSubmission = z.infer<typeof insertContentSubmissionSchema>;
export type ContentSubmission = typeof contentSubmissionsTable.$inferSelect;

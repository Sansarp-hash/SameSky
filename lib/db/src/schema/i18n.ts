import { pgTable, text, serial, timestamp, unique, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const i18nNamespaceEnum = pgEnum("i18n_namespace", [
  "ui",
  "notification",
  "content_title",
  "content_synopsis",
  "email",
]);

export const i18nStringsTable = pgTable(
  "i18n_strings",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    namespace: i18nNamespaceEnum("namespace").notNull().default("ui"),
    languageCode: text("language_code").notNull(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [unique().on(t.key, t.namespace, t.languageCode)]
);

export const insertI18nStringSchema = createInsertSchema(i18nStringsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertI18nString = z.infer<typeof insertI18nStringSchema>;
export type I18nString = typeof i18nStringsTable.$inferSelect;

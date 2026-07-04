import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const homepageSectionsTable = pgTable("homepage_sections", {
  id: serial("id").primaryKey(),
  sectionName: text("section_name").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
  contentQueryParams: jsonb("content_query_params").notNull().default({}),
});

export const insertHomepageSectionSchema = createInsertSchema(homepageSectionsTable).omit({
  id: true,
});
export type InsertHomepageSection = z.infer<typeof insertHomepageSectionSchema>;
export type HomepageSection = typeof homepageSectionsTable.$inferSelect;

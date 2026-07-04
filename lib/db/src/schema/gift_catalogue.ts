import { pgTable, text, serial, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const giftTierEnum = pgEnum("gift_tier", ["small", "medium", "large"]);

export const giftMasterTable = pgTable("gift_master", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  coinCost: integer("coin_cost").notNull(),
  tier: giftTierEnum("tier").notNull(),
  animationTriggerKey: text("animation_trigger_key").notNull(),
});

export const stickerPacksTable = pgTable("sticker_packs", {
  id: serial("id").primaryKey(),
  packName: text("pack_name").notNull().unique(),
  coinCost: integer("coin_cost").notNull(),
  stickerAssetUrls: text("sticker_asset_urls").array().notNull().default([]),
});

export const insertGiftMasterSchema = createInsertSchema(giftMasterTable).omit({ id: true });
export const insertStickerPackSchema = createInsertSchema(stickerPacksTable).omit({ id: true });

export type GiftMaster = typeof giftMasterTable.$inferSelect;
export type StickerPack = typeof stickerPacksTable.$inferSelect;

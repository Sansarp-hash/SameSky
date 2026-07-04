import { runMigrations } from "stripe-replit-sync";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import app from "./app";
import { logger } from "./lib/logger";
import { getStripeSync } from "./lib/stripeClient";

/**
 * Work around a bug in stripe-replit-sync's migrations: migration 0004 guards
 * its `create type "stripe"."subscription_status"` with an UNQUALIFIED check
 * (`pg_type WHERE typname = 'subscription_status'`). This app already defines a
 * `public.subscription_status` enum, so the guard sees a same-named type, skips
 * creation, and the subsequent table fails with `type "stripe.subscription_status"
 * does not exist`. We pre-create the enum in the `stripe` schema (schema-qualified
 * + idempotent) with the original 7 values; migration 0039 later adds `paused`.
 */
async function ensureStripeSubscriptionStatusEnum(): Promise<void> {
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS stripe`);
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'subscription_status' AND n.nspname = 'stripe'
      ) THEN
        CREATE TYPE "stripe"."subscription_status" AS ENUM (
          'trialing',
          'active',
          'canceled',
          'incomplete',
          'incomplete_expired',
          'past_due',
          'unpaid'
        );
      END IF;
    END
    $$;
  `);
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/**
 * Initialize the Stripe sync schema + managed webhook on startup. Failures here
 * are logged but do not crash the server — the rest of the app must keep
 * running even if Stripe is temporarily unreachable.
 */
async function initStripe(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — skipping Stripe initialization");
    return;
  }

  try {
    await ensureStripeSubscriptionStatusEnum();
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    const stripeSync = await getStripeSync();
    const primaryDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
    if (primaryDomain) {
      const webhookResult = await stripeSync.findOrCreateManagedWebhook(
        `https://${primaryDomain}/api/stripe/webhook`,
      );
      logger.info(
        { url: (webhookResult as { url?: string })?.url ?? "configured" },
        "Stripe managed webhook ready",
      );
    }

    stripeSync
      .syncBackfill()
      .then(() => logger.info("Stripe data backfill complete"))
      .catch((err) => logger.error({ err }, "Stripe data backfill failed"));
  } catch (err) {
    logger.error({ err }, "Failed to initialize Stripe (continuing without it)");
  }
}

await initStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

---
name: stripe-replit-sync quirks
description: Two non-obvious failures when wiring stripe-replit-sync into the api-server (esbuild __dirname banner + enum name collision)
---

# stripe-replit-sync integration quirks (api-server)

Two separate failures both surface as "Stripe schema not created / tables missing" and are easy to confuse.

## 1. esbuild banner rewrites `__dirname` → migrations folder not found

**Symptom:** `runMigrations()` runs with no error but creates 0 tables (the `stripe` schema stays empty).

**Cause:** `stripe-replit-sync` locates its bundled `./migrations/*.sql` relative to its own `__dirname`. The api-server build (`build.mjs`) bundles with esbuild and injects a banner that redefines `__dirname`, so the package resolves the wrong path and silently finds no migration files.

**Fix:** add `"stripe-replit-sync"` to esbuild `external[]` in `build.mjs` so it stays a real `node_modules` require at runtime and keeps its true `__dirname`. This means the package must be a real dependency of `@workspace/api-server` (add `stripe` + `stripe-replit-sync` to its package.json), not just root-hoisted.

## 2. Unqualified enum guard collides with app's own `subscription_status`

**Symptom:** migrations partially run, then fail on the `subscriptions` migration with `type "stripe.subscription_status" does not exist`.

**Cause:** migration `0004_subscriptions.sql` guards its `create type "stripe"."subscription_status"` with an UNQUALIFIED check `SELECT 1 FROM pg_type WHERE typname = 'subscription_status'`. This app already defines `public.subscription_status`, so the guard sees a same-named type in another schema, skips creating the stripe one, and the table build then fails.

**Fix:** before calling `runMigrations()`, pre-create the enum schema-qualified + idempotent: `CREATE SCHEMA IF NOT EXISTS stripe` then create `stripe.subscription_status` with the ORIGINAL 7 values only (`trialing, active, canceled, incomplete, incomplete_expired, past_due, unpaid`). Do NOT include `paused` — migration `0039` runs `ALTER TYPE ... ADD VALUE 'paused'` (no IF NOT EXISTS) and will error if the value already exists.

**Why it matters in prod:** the collision reproduces on any DB where `public.subscription_status` exists before server startup, so the pre-create workaround must run unconditionally in `initStripe`, not just once by hand.

---
name: Backend logic rules
description: Eleven critical system rules from the product spec that must be enforced in API route handlers and workers — not derivable from schema alone.
---

## Age Gate — content tier mapping
- Under 15: hard block, no registration
- 15–17: `contentTier = 'no_media_access'` — account exists, can use social/community features, but ALL ContentEntry queries must return empty/403; no SFW, Mature, or Explicit media
- 18+ (unverified adult): `contentTier = 'sfw_only'`
- 18+ free verified: `contentTier = 'mature'` (SFW + Mature visible; Explicit blocked)
- 18+ premium: `contentTier = 'explicit_eligible'` (all content tiers)

**How to apply:** Every route that returns `ContentEntry` records must filter `WHERE content_entries.content_rating` against the caller's `contentTier`. For `no_media_access`, return an empty result set or 403 — never the actual content.

## Mute — Fake 200 OK Rule
When a muted user performs an action (comment, DM, reaction) directed at the muter:
- The API must return a standard `200 OK` to the muted sender (no error, no indication they are muted)
- The system silently drops the notification before inserting it into `notifications` for the muter
- For feed queries: muted users' posts and comments are filtered out of the muter's response before the payload is sent

**Why:** Prevents the muted user from deducing they are muted and circumventing it.

## Raffle Weighted Random Draw Formula
`Weight(entrant) = (isFreeEntry ? 1 : 0) + paidEntriesCount`

Build a weighted array from all `*_raffle_entries` rows for the raffle, select a random index from the weighted pool, map back to `user_id`. This is the canonical formula for all raffle types (Design Directive, Personal Item, Fan Meet, Merch, Fan Letter).

## Design Directive Options Lockout
`design_directive_raffles.design_options[]` must be **stripped from the API response** until the associated `live_streams.status = 'live'`. Check `liveStreamId → live_streams.status` before serializing the raffle detail response.

## Fan Meet Ticket — 90% Platform Cost Auto-Calculation
On winner draw: `platform_cost_usd = official_ticket_price_usd * 0.90`. Write this computed value to `fan_meet_ticket_raffles.platform_cost_usd` in the same transaction as the winner assignment.

## Withdrawal Role Enforcement
Only users with `role IN ('actress', 'admin', 'super_admin')` may trigger a `WithdrawalRequest`. Roles `free`, `premium`, `moderator` must receive a `403 Forbidden` before any payment execution logic is reached.

## Watchlist → Leaderboard Async Counter
Any `INSERT`, `UPDATE`, or `DELETE` on `watchlist_entries` must enqueue an async job to recalculate the affected user's activity counter on the global leaderboard. The leaderboard `Most Active Community Members` score is a composite of posts + comments + likes + watchlist mutations.

## i18n Fallback Chain
Resolution order for any translatable string (title, synopsis, notification message):
1. Look up `i18n_strings` where `key = <key> AND language_code = user.preferred_language`
2. If not found → look up `language_code = 'en'`
3. If still not found → use the raw base value stored directly on the entity record

**Why:** Prevents blank/null display values for users with non-English preferred language when a translation hasn't been added yet.

## Cascade Ban at 5 AI Violation Strikes
When `users.ai_violation_strikes` reaches 5, execute in a single transaction:
1. Set `users.is_banned = true`, `users.role = 'free'` (strip elevated roles), `users.premium_status = false`
2. Cancel their active Stripe subscription (call Stripe API `subscriptions.cancel`)
3. Soft-delete all their `dm_threads` rows (set a `deleted_at` flag or mark both participants as inactive)
4. Exclude their `user_id` from all leaderboard queries (add `is_banned = false` filter to leaderboard endpoints)

## Super Admin Analytics Telemetry Fields
The `platform_analytics_snapshots` table tracks: `viewers_count`, `coin_transactions_total`, `top_gifters_list`, `actress_earnings_aggregate`, `merch_orders_pending`, `ticket_winners_by_country_code`, `block_mute_rates_percentage`. Snapshots should be written on a scheduled interval (e.g., every 15 minutes) by a background worker.

## Gift Tray — Standard Coin Costs
Canonical gift catalogue (seed data for `gift_master`):
- Rose: 10 coins, small
- Heart: 20 coins, small
- Bouquet: 50 coins, medium
- Rainbow: 80 coins, medium
- Crown: 200 coins, large
- GL Logo: 500 coins, large

## Content Tier Default at Registration
New users default to `contentTier = 'no_media_access'`. The age verification endpoint (`POST /users/me/verify-age`) is the only path that upgrades the tier:
- DOB → age < 15 → 403 hard block (account cannot be created)
- DOB → age 15–17 → `no_media_access` (stays)
- DOB → age 18+ → `mature` (free) or `explicit_eligible` after premium upgrade

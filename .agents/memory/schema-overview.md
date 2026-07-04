---
name: Schema overview
description: High-level map of the 50-table SameSky DB; integer serial PKs throughout; Drizzle ORM + PostgreSQL.
---

## Design decisions
- Integer serial PKs everywhere (not UUIDs) — consistent with existing codebase
- Drizzle ORM v0.45 with `drizzle-zod` for insert schemas
- `pgEnum` for all typed enumerations
- `jsonb` for flexible JSON payloads (career timelines, ship profiles, notification payloads, etc.)
- All schema in `lib/db/src/schema/` — one file per domain; all exported from `index.ts`
- When drizzle-kit push fails due to TTY requirement (enum renames, destructive changes), apply raw SQL via `psql "$DATABASE_URL"` instead

## Key enum names (PostgreSQL type names)
- `user_role`: free | premium | moderator | actress | admin | super_admin
- `content_tier`: no_media_access | sfw_only | mature | explicit_eligible
- `content_rating`: sfw | mature | explicit
- `loyalty_badge`: gl_fan | gl_supporter | loyal_fan | gl_legend
- `coin_transaction_type`: purchase | spend | earn | withdrawal | bonus | raffle_entry | raffle_refund
- `raffle_approval_status`: draft | pending_actress_approval | live | drawing | completed | rejected | cancelled
- `subscription_status`: active | past_due | canceled | unpaid
- `withdrawal_status`: pending | processed | rejected
- `gift_tier`: small | medium | large
- `career_listing_type`: audition | casting_call | writing | production | gl_industry_role
- `content_submission_status`: pending | approved | rejected
- `report_target_type`: user | post | comment | fan_art | direct_message
- `report_status`: open | under_review | resolved_no_action | resolved_action_taken

## Schema files → tables
- `users.ts` → users
- `posts.ts` → posts, post_likes, comments
- `coins.ts` → coin_transactions
- `follows.ts` → follows
- `notifications.ts` → notifications
- `raffles.ts` → raffles, raffle_entries (legacy simple raffle)
- `actress_profiles.ts` → actress_profiles
- `content_entries.ts` → content_entries
- `watchlist.ts` → watchlist_entries
- `reviews.ts` → reviews
- `fan_art.ts` → fan_art
- `polls.ts` → polls, poll_votes
- `direct_messages.ts` → dm_threads, dm_messages
- `fan_letters.ts` → fan_letters
- `live_streams.ts` → live_streams, stream_chat_messages, virtual_gift_log, withdrawal_requests, actress_earnings
- `social_controls.ts` → user_blocks, user_mutes, content_strikes, follow_notification_prefs
- `subscriptions.ts` → subscription_config, subscriptions, coin_purchases, platform_config
- `raffles_advanced.ts` → design_directive_raffles + entries, personal_item_raffles + entries, fan_meet_ticket_raffles + entries, merch_raffles + entries
- `career.ts` → career_listings, career_applications, creator_applications
- `reports.ts` → reports
- `homepage.ts` → homepage_sections
- `gift_catalogue.ts` → gift_master, sticker_packs
- `content_submissions.ts` → content_submissions
- `analytics.ts` → platform_analytics_snapshots
- `i18n.ts` → i18n_strings

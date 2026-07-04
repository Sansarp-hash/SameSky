# SameSky

The dedicated home for Thai GL (Girl's Love) series fans worldwide — discover series, celebrate ships, share GL shorts and clips, and connect with the global GL community. Community participation earns Stars (virtual currency) redeemable for Community Drops.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/gl-social run dev` — run the frontend (port 20268, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned via Clerk setup

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query + Tailwind v4 + shadcn/ui
- API: Express 5 + Drizzle ORM + PostgreSQL
- Auth: Clerk (Replit-managed) — email/password + OAuth
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, posts, coins, raffles, notifications)
- `artifacts/api-server/src/routes/` — Express route handlers per feature
- `artifacts/gl-social/src/` — React frontend (pages in `src/pages/`)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation (do not edit)

## Architecture decisions

- **Clerk proxy pattern**: Clerk auth runs through the Express server proxy middleware for production SSO compatibility. Cookie-based auth — no Bearer tokens on the web client.
- **JIT user provisioning**: Users are created in the local DB on first API call via `getOrCreateUser()`. Clerk ID is the foreign key linking Clerk identity to the local user record.
- **OpenAPI-first**: All API contracts are defined in `openapi.yaml` before implementation. Never hand-write types that codegen produces.
- **Role system**: `free`, `premium`, `admin` — stored in DB. Admin role gates all `/admin` routes server-side AND client-side.
- **Stars (GL Coins)**: Virtual currency shown as "Stars" in the UI; all changes go through `coin_transactions` table for audit trail. The DB/API column is still named `coinBalance` / `coin_transactions` — only the UI label changed.

## Product

- **Social feed**: Post text, like and comment on posts, hashtag support — centered on Thai GL series discussion
- **Stars**: Virtual currency earned through community activity; admins can add Stars to users manually
- **Community Drops**: Time-boxed entry windows (raffles), Star cost to enter, admin draws random winner
- **Notifications**: In-app alerts for drop events, likes, comments, Star credits
- **Admin panel**: User management (ban/unban, add Stars), drop creation + winner draw, platform stats

## User preferences

- No emojis in the UI
- Classic and expensive aesthetic — editorial luxury: warm obsidian background, single champagne-gold accent, Playfair Display serif display type, generous negative space. Think Mandarin Oriental Bangkok, not Twitch. (Design tokens live in `artifacts/gl-social/src/index.css`.)
- Main focus is Thai GL content community; Stars/drops are secondary/subtle

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after every change to `openapi.yaml`
- Run `pnpm --filter @workspace/db run push` after every schema change in `lib/db/src/schema/`
- Clerk dev keys show a console warning — this is expected and harmless in development
- The first signed-in user needs to be manually promoted to admin via direct DB update: `UPDATE users SET role = 'admin' WHERE clerk_id = '<your-clerk-id>';`
- The DB/API uses `coinBalance` and `coin_transactions` — the UI renames these to "Stars" but the backend stays as-is

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for auth setup and customization

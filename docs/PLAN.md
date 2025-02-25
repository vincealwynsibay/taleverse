# Plan: Taleverse showpiece

## Goal
Turn Taleverse into a portfolio showpiece: a polished web-novel platform where a reviewer can, in about two minutes and without making an account, read a free chapter, hit an early-access paywall, buy credits with a Stripe test card, unlock the chapter, then switch to the admin view and schedule a release.

## Flows
- Visitor lands on the home page, opens a novel, reads a free chapter with adjustable typography and theme.
- Visitor clicks "Try as Reader", gets signed into the demo reader with starter credits, unlocks an early-access chapter, and the balance drops.
- Reader buys a credit pack (Stripe Checkout test mode, or the fake provider locally); the webhook credits the ledger exactly once.
- Reader adds a novel to the library, leaves a rating and review, comments on a chapter, and later resumes from "Continue reading".
- Visitor browses by genre, sorts by rating or updates, and searches by title or author.
- Visitor clicks "Try as Admin", edits a chapter, schedules its publish and free dates, and sees it on the public release schedule.
- `pnpm demo:reset` (later a Vercel Cron route) restores the catalog and the demo accounts.

## Slices
### S1. Modernize the stack
Depends: none
Done when:
- Next 16, React 19.2+, Clerk 7, Prisma 7 (driver adapter), Tailwind 4, BlockNote current, Zod 4.
- `pnpm typecheck`, `pnpm lint` and `pnpm build` pass.

### S2. Data model and security fixes
Depends: S1
Done when:
- Chapters are unique per novel (`@@unique([novelId, number])`), not globally.
- Credits are an append-only ledger with idempotency keys; unlocks are atomic and cannot double-spend.
- Every server action derives the user from the session; admin actions check the role.
- No secret key under a `NEXT_PUBLIC_` name; no debug `console.log`s.

### S3. Seed content
Depends: S2
Done when:
- Public-domain novels from Project Gutenberg are committed as seed data, split into chapters.
- The seed builds a realistic schedule relative to "now": free back catalog, early-access chapters, upcoming releases.

### S4. Reader experience
Depends: S2, S3
Done when:
- Home, browse, genre, novel, reader, schedule, library and credits pages are built on real data (no placeholders).
- The reader is server-rendered, with font, size, line-height, width and theme settings, and prev/next navigation.
- The paywall shows a preview plus an unlock card; full content never reaches a client that lacks access.

### S5. Payments
Depends: S2
Done when:
- Credit packs go through Stripe Checkout (test mode); the webhook is verified and idempotent.
- A fake provider runs the same ledger path when Stripe isn't configured (dev only).

### S6. Social features
Depends: S4
Done when:
- Library, reading progress, ratings and reviews (with cached aggregate), and chapter comments all work.

### S7. Admin
Depends: S2
Done when:
- A dashboard with stats, novel CRUD with genres and status, and a chapter table with draft / scheduled / early-access / free states.
- The editor saves and sets the publish date, free date and price.

### S8. Demo personas and reset
Depends: S5, S7
Done when:
- "Try as Reader" and "Try as Admin" sign into shared demo accounts with one click.
- `pnpm demo:reset` and `/api/cron/demo-reset` restore the demo state.

### S9. Quality
Depends: all
Done when:
- Vitest unit and integration tests (access rules, ledger concurrency, Gutenberg splitter, block renderer).
- A GitHub Actions CI workflow (lint, typecheck, test against Postgres, build).
- The README sells the project: screenshots, architecture, decisions, local setup.

## Out of scope
- Multi-author platform, payouts, Stripe Connect.
- Subscriptions (removed; see DECISIONS.md).
- Production deploy (Vercel + Neon later; code is ready for it).
- Comment moderation tooling beyond author/admin delete.

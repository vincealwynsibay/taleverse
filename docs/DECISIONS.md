# Decisions

Grilled with Vince on 2026-11-14. Where he stopped the grill and said "just do the recommended actions", the recommended option was taken.

## Decided by Vince
- **Goal:** portfolio showpiece, not a real business (yet).
- **Audience:** all of them: full-stack, frontend, freelance and backend reviewers. One demo flow has to show every strength.
- **Demo access:** one-click demo personas (reader and admin) on shared seeded accounts; Stripe in test mode; nightly reset.
- **Stack:** full modernization first, before feature work.
- **Money model:** credits plus early access. Subscriptions removed.
- **Hosting:** local only for now; target Vercel + Neon later, so nothing may depend on local-only infrastructure.
- **Seed content:** public-domain classics from Project Gutenberg.
- **Features:** library and reading progress, genres and browse, ratings and reviews, chapter comments.

## Decided on the recommended path (overnight)
- **Chapter URLs** are `/novels/{slug}/{number}`, not a chapter slug. Numbers are stable, short and unique per novel.
- **One chapter per page**, server-rendered. The old infinite-scroll reader sent every chapter's full content to the client, which defeats a paywall and SEO.
- **Chapter content is rendered on the server** by a small renderer over the BlockNote JSON subset we allow (paragraph, heading, quote, image, divider; bold/italic/underline/strike/code/links). It needs no `dangerouslySetInnerHTML` and ships no editor JS to readers.
- **Credits ledger:** an append-only `CreditLedgerEntry` with a unique `idempotencyKey`. The balance is `SUM(delta)`. A spend locks the user row (`SELECT … FOR UPDATE`) inside a transaction, checks the balance and writes the entry plus the unlock. Stripe webhooks use `stripe:{checkoutSessionId}` as the key, so retries cannot double-credit.
- **Price** is per chapter (`unlockPrice`, default 5 credits), so an admin can price chapters differently.
- **Fake payment provider:** if `STRIPE_SECRET_KEY` is unset (dev only), "Buy" credits the ledger directly through the same function the webhook uses, so the whole flow runs on a fresh clone.
- **User sync:** a user row is upserted lazily from Clerk on first authenticated request, and the Clerk webhook becomes an optimization. Locally there is no public URL for webhooks.
- **Migrations squashed** into one new baseline. The schema changed almost entirely and nothing is deployed.
- **Covers:** seeded novels get generated typographic covers (consistent and designed) instead of the uneven Gutenberg scans. Uploaded covers still go to Cloudinary.
- **Editor image uploads** go to Cloudinary, replacing tmpfiles.org, which deletes files after an hour.
- **Demo reset** restores seeded novels by slug and chapter number, deletes non-seed content and wipes demo users' activity. Real users' data on seed chapters is kept.
- **Commits** are on branch `showpiece`, authored as Vince, with no AI attribution trailers, matching this repo's history. Nothing is pushed.

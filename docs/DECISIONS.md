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

## Added while building
- **Read-only mode without Clerk keys.** Clerk Core 3 no longer runs keyless, and its CLI writes keys to a local env file, which this machine's secrets guard keeps off-limits to agents. So the app runs without keys: browsing and free chapters work, while auth-only UI is disabled with a setup hint. CI builds this way too.
- **`DEV_AS=reader|admin`** signs in a local dev account when Clerk isn't configured (never in production). It was used to click through every signed-in flow overnight.
- **Raw SQL for view counts and rating refreshes**, so they don't bump `Novel.updatedAt`, which drives "Recently updated".
- **Integration tests use `prisma migrate deploy`**, not `migrate reset`: Prisma refuses destructive commands from AI agents. Each test truncates its own tables.
- **Visual style: a blend (decided by Vince after seeing the rebuild).** The overnight redesign used warm paper with an orange accent. Vince chose to blend it with the original look: the original neutral shadcn greys and the teal of the old "taleverse.1" logo, keeping the new layouts. The paper and sepia reader themes remain as reading options.
- **Look and reader modelled on chikari.moe (decided by Vince).** After two rounds he said the redesign "feels very AI" and pointed at https://chikari.moe/ as the reference. The site is now a dark-slate, content-first web-novel layout: wordmark header with Ctrl K search, badge covers on shelves, a banner hero on novel pages with read markers on chapter rows, a recent-comments feed, and a sign-up card for guests. The reader follows chikari's floating controls (title pill, chapter picker, settings panel with auto-scroll Off / Creep / Jump, progress indicators and tap behaviour), plus a now-playing pill for auto-scroll and read-aloud (browser speech synthesis). Vince then asked to keep the teal accent from the original logo instead of chikari's blue, so: chikari layout and slate base, teal accent.
- **Fonts: Geist + Geist Mono (decided by Vince).** He didn't like the Fraunces / Literata pairing. Geist covers headings, UI, chapter text and the editor; Geist Mono is used for the small uppercase labels. The reader's typeface setting offers Geist (default) or a system serif (no extra download). Social cards use a bundled static Geist SemiBold.
- **Per-viewer routes are `force-dynamic`** so a keyless build can't prerender a redirect for `/library`, `/credits` or `/admin`.

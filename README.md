<p align="center"><img src="brand/readme-hero.png" alt="Taleverse: serial fiction, one chapter at a time" width="100%"></p>

# Taleverse

**Serial fiction, one chapter at a time.** A web-novel platform: the back catalogue is free, the newest chapters are early access for credits, and every chapter goes free for everyone a week after release.

> Try it without an account: **Try as a reader** signs you into a shared demo account with 25 credits; **Try as an admin** lets you write and schedule chapters. Payments run in Stripe test mode (`4242 4242 4242 4242`). Demo data resets nightly.

## The two-minute tour

1. **Browse.** A content-first home page: a spotlight of featured novels, trending and completed shelves, latest updates, a top-rated ranking and the newest comments. 17 public-domain classics with their real first-edition cover art.
2. **Read.** The reader works like a reading app. The top and bottom bars dock out of the way and come back with a tap. Read as a scroll or as pages with a 3D page flip and swipe, let it auto-scroll, or have it read aloud with the current line highlighted. Tune the typeface (including Atkinson Hyperlegible), size, spacing, width and theme; turn on focus mode or a warm night light. Select any word to look it up.
3. **Talk.** Comment on a single paragraph from the margin, or join the chapter discussion: Reddit-style threads with replies, votes and collapsible branches.
4. **Hit the paywall.** The newest chapters of ongoing novels are in early access. You see a preview, the price, and when the chapter goes free. As the demo reader, spend 5 credits to unlock it.
5. **Top up.** Buy a credit pack through Stripe Checkout; the webhook credits your account exactly once.
6. **Publish.** Switch to the demo admin, edit a chapter in the block editor, and schedule its release and early-access window. It appears on the public release schedule.

Along the way: a library with reading progress and "Continue reading", ratings and reviews, genre pages, Ctrl K search, and light/dark themes.

| Page-flip reader | Paragraph comments | Reader settings |
|---|---|---|
| ![Paged reader](docs/screenshots/mobile-reader-paged.jpeg) | ![Paragraph comments](docs/screenshots/mobile-reader-paragraph.jpeg) | ![Reader settings](docs/screenshots/mobile-reader-settings.jpeg) |

| Home | Novel page |
|---|---|
| ![Home](docs/screenshots/home.jpeg) | ![Novel page](docs/screenshots/novel-dark.jpeg) |
| **Threaded comments** | **Early-access paywall** |
| ![Comments](docs/screenshots/comments.jpeg) | ![Paywall](docs/screenshots/paywall.jpeg) |
| **Desktop reader, sepia, pages** | **Admin chapter editor** |
| ![Reader](docs/screenshots/reader-paged.jpeg) | ![Admin editor](docs/screenshots/admin-editor.jpeg) |

All 44 screenshots, grouped by reader and writer (admin), are in the [screenshot gallery](docs/screenshots/README.md); logos, social images and posters are in the [brand kit](brand/README.md).

## Stack

Next.js 16 (App Router, Server Components, Server Actions) · React 19 · TypeScript · Prisma 7 on PostgreSQL · Clerk · Stripe Checkout · Tailwind CSS 4 + shadcn/ui · BlockNote · Vitest · Playwright · GitHub Actions

## Engineering notes

The parts most worth reading in the code:

**A credit ledger, not a balance column** ([`src/lib/credits.ts`](src/lib/credits.ts)). Credits are an append-only `CreditLedgerEntry` table, and a balance is `SUM(delta)`. Every write carries a unique idempotency key (`stripe:<session>`, `unlock:<user>:<chapter>`), so a retried webhook or a double-clicked button can't create a second entry. Unlocking runs in a transaction that first takes a row lock on the user (`SELECT … FOR UPDATE`), so concurrent unlocks serialize and the balance can't go negative. [Integration tests](src/lib/credits.test.ts) fire parallel unlocks at a real Postgres to prove it.

**Payments that can't double-credit** ([`src/lib/payments.ts`](src/lib/payments.ts)). Checkout Sessions are fulfilled both by the [signature-verified webhook](src/app/api/webhooks/stripe/route.ts) and on the success redirect, whichever arrives first. The ledger's idempotency key makes the second a no-op. The success redirect only fulfils a session that belongs to the signed-in user.

**Access rules in one pure function** ([`src/lib/access.ts`](src/lib/access.ts)). A chapter is *draft → scheduled → early access → free*, derived from two timestamps (`publishedAt`, `freeAt`) at query time. No cron job has to flip a flag, so nothing can fail to fire. The chapter list, the reader and the unlock action all use the same function.

**Paywalled content never leaves the server.** A locked chapter's page only receives a short preview ([`previewBlocks`](src/lib/blocks.ts)), not the full chapter hidden behind CSS. Chapters are stored as BlockNote JSON and rendered by a [small server-side renderer](src/components/reader/ChapterBody.tsx) that allows only known block types, escapes all text and drops `javascript:` links. Readers get semantic HTML with no `dangerouslySetInnerHTML` and no editor JavaScript.

**Authorization at the data layer.** Every server action derives the user from the session ([`src/lib/auth.ts`](src/lib/auth.ts)) and never trusts a client-supplied user ID. Admin actions check the role. `proxy.ts` only attaches auth state; it isn't relied on for authorization (see CVE-2025-29927).

**One-click demo accounts** ([`src/app/actions/demo.ts`](src/app/actions/demo.ts)). The server finds or creates the shared Clerk user, then issues a short-lived sign-in token, which the client exchanges for a session (`signIn.ticket()`). A [nightly reset](src/lib/seed/index.ts) (Vercel Cron → `/api/cron/demo-reset`) restores the catalogue, regenerates release dates relative to now so early-access chapters are always live, and wipes demo activity, while keeping real users' purchases.

**Real content.** Seventeen public-domain novels from Project Gutenberg, split into 492 chapters by a [tested importer](src/lib/seed/gutenberg.ts) that strips boilerplate, skips tables of contents, keeps verse line breaks and turns `_underscores_` into italics. Covers and banners are public-domain first-edition art, credited on each novel page.

**A reader that stays on the client only where it must** ([`src/components/reader/`](src/components/reader)). The chapter is server-rendered HTML; the shell around it adds the bars, page mode (CSS columns plus a Web Animations page flip), auto-scroll, read-aloud (`speechSynthesis`) and the paragraph-comment margin. Reader settings live in a cookie, so the first paint already has your font, theme and layout.

**Works with zero config.** Without Clerk keys the app runs read-only (browse and read free chapters). Without Stripe keys, purchases go through a simulated provider that uses the same ledger path (development only). CI builds in exactly that mode.

More background is in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Run it locally

Requires Node 22+, pnpm and Docker.

```bash
pnpm install
pnpm db:up          # Postgres 17 in Docker (plus a separate test database)
pnpm db:deploy      # apply migrations
pnpm db:seed        # 17 novels, 492 chapters, readers, reviews, comments
pnpm dev            # http://localhost:3000
```

That gives you the read-only site. To turn everything on:

- **Accounts and demo buttons:** `npx clerk@latest init` writes temporary Clerk dev keys to `.env.local` (no Clerk account needed). Restart `pnpm dev`.
- **Or skip Clerk entirely:** `DEV_AS=reader pnpm dev` (or `DEV_AS=admin`) signs every request in as a local dev account.
- **Real Stripe test payments:** set `STRIPE_SECRET_KEY` and run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` for `STRIPE_WEBHOOK_SECRET`.

All variables are documented in [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md).

| Command | What it does |
|---|---|
| `pnpm test` | Unit tests plus Postgres integration tests (ledger concurrency, demo reset) |
| `pnpm test:e2e` | Playwright: guest paywall, reader unlock / purchase / library / review / comment, admin scheduling, against its own database |
| `pnpm lint` / `pnpm typecheck` | ESLint and TypeScript |
| `pnpm demo:reset` | Restore the catalogue and demo accounts |
| `pnpm import:gutenberg` | Re-download and re-split the seed novels |
| `pnpm screenshots` | Re-capture `docs/screenshots` (44 views, plus a gallery page) from a running `DEV_AS=reader pnpm dev` |
| `pnpm brand:logo` / `pnpm brand:render` | Regenerate the logo set and the brand kit (social images, posters, framed screenshots, app icons) |

## Deploying

Built for Vercel + Neon: set `DATABASE_URL`, the Clerk and Stripe keys, `APP_URL` and `CRON_SECRET`; `vercel.json` schedules the nightly demo reset. Run `pnpm db:deploy && pnpm db:seed` once against the production database. The step-by-step checklist, with webhooks, checks and troubleshooting, is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Credits

Novel texts are in the public domain and come from [Project Gutenberg](https://www.gutenberg.org). Cover and banner art is public domain; sources are listed in [`prisma/seed-data/art.json`](prisma/seed-data/art.json). Taleverse is not affiliated with Project Gutenberg.

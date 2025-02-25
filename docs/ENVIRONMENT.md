# Environment variables

Every variable is optional for local development. With none set, Taleverse runs in **read-only mode**: browse, search and read free chapters against the local Docker database.

Put these in `.env.local` (git-ignored). Next.js loads it for the app, and `prisma.config.ts` loads `.env` for the CLI.

| Variable | Needed for | Notes |
|---|---|---|
| `DATABASE_URL` | Everything | Defaults to the Docker database `postgresql://taleverse:taleverse@localhost:5432/taleverse`. On Neon, use the pooled URL. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Sign-in, demo accounts | `npx clerk@latest init` creates temporary dev keys without an account. |
| `CLERK_SECRET_KEY` | Sign-in, demo accounts | Written by `clerk init` with the key above. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | `/api/webhooks/clerk` | Optional; users are also synced on first request. |
| `ADMIN_EMAILS` | Admin role for real accounts | Comma-separated. Matching accounts become admins on first sign-in. |
| `STRIPE_SECRET_KEY` | Real Checkout (test mode) | `sk_test_…`. Without it, purchases are simulated locally (never in production). |
| `STRIPE_WEBHOOK_SECRET` | `/api/webhooks/stripe` | From `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. |
| `APP_URL` | Stripe redirect URLs, metadata | Defaults to `http://localhost:3000`. |
| `CLOUDINARY_URL` | Cover and chapter image uploads | Without it, uploads go to `public/uploads` (dev only). |
| `CRON_SECRET` | `/api/cron/demo-reset` | Vercel Cron sends it as a bearer token. |
| `DEMO_ENABLED` | Demo buttons | Set to `false` to turn off the one-click demo accounts. |
| `ALLOW_FAKE_PAYMENTS` | Production without Stripe | `true` lets a production build use the simulated provider. Only for private previews. |
| `DEV_AS` | Local development without Clerk | `reader` or `admin` signs every request in as a local dev account. A `tv_dev_as` cookie (`reader`, `admin` or `guest`) switches persona per browser; the E2E tests use it. Ignored when Clerk is configured and always in production. |
| `E2E_DATABASE_URL` | `pnpm test:e2e` | Defaults to `taleverse_e2e` on the Docker server; created automatically. |

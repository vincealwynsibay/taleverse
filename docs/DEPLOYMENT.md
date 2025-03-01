# Deploying Taleverse

A checklist for putting Taleverse online with **Vercel** (hosting), **Neon** (Postgres), **Clerk** (sign-in), **Stripe** (test-mode payments) and **Cloudinary** (image uploads). Every service has a free tier that covers a portfolio demo. Allow about 30 minutes.

Work through the steps in order: some need a value from an earlier step, and the Stripe webhook needs the site's final address.

Keys and secrets go straight into the service dashboards. None of them belong in the repo.

## What you'll end up with

| Where | What |
|---|---|
| `https://<project>.vercel.app` | The live site, with "Try as a reader" and "Try as an admin" buttons |
| Neon | The production database, seeded with 17 novels |
| Vercel Cron | A daily reset at 07:00 UTC that restores the catalogue, release dates and demo accounts |

## Before you start

- [ ] The code is on GitHub: `vincealwynsibay/taleverse`, branch `main`
- [ ] Locally: Node 22+, pnpm, and a checkout of `main` (`pnpm install` done)
- [ ] Accounts (sign in with GitHub where offered): vercel.com, neon.tech, clerk.com, stripe.com, cloudinary.com

Pick the project name now, because it decides the URL. This guide writes it as `<project>`, so the site is `https://<project>.vercel.app`.

## 1. Database: Neon

1. Create a project at **console.neon.tech**. Use Postgres 17 and the region closest to your Vercel region (Vercel defaults to `iad1`, Washington DC, so pick **AWS US East 1**).
2. Open **Connect** on the project dashboard and copy two connection strings:
   - **Pooled** (the host contains `-pooler`). The app uses this one.
   - **Direct** (turn off "Connection pooling"). Migrations and seeding use this one.
3. On your machine, from the repo root, create the tables and load the content using the **direct** string:

   ```bash
   DATABASE_URL="<direct connection string>" pnpm db:deploy
   DATABASE_URL="<direct connection string>" pnpm db:seed
   ```

   Seeding takes a minute or two over the network. It should end without errors after listing the 17 novels.

**Check:** in Neon's **Tables** view, `Novel` has 17 rows and `Chapter` has 492.

## 2. Sign-in: Clerk

1. At **dashboard.clerk.com**, create an application called Taleverse. Enable **Email** and, if you like, **Google** and **GitHub**.
2. Go to **Configure → API keys** and copy:
   - the **Publishable key** (`pk_test_…`)
   - the **Secret key** (`sk_test_…`)

A development instance (`pk_test_`) works on a `vercel.app` address and is fine for a portfolio, though it shows a small "Development mode" badge. A production instance (`pk_live_`) needs a domain you own. Set that up later if you add one.

## 3. Payments: Stripe (test mode)

1. At **dashboard.stripe.com**, make sure **Test mode** is on (top right).
2. Go to **Developers → API keys** and copy the **Secret key** (`sk_test_…`).

You add the webhook in step 6, once the site has its address.

## 4. Image uploads: Cloudinary

The admin area uploads cover art and chapter images. Vercel's disk is read-only, so uploads need Cloudinary.

1. At **console.cloudinary.com**, open the **Dashboard**.
2. Copy the **API environment variable**. It looks like `cloudinary://<key>:<secret>@<cloud name>`.

Skipping this only breaks uploads. Everything else works.

## 5. Hosting: Vercel

1. At **vercel.com/new**, import `vincealwynsibay/taleverse` and name the project `<project>`.
2. Leave the framework (Next.js), build command and output settings as they are.
3. Before deploying, open **Environment Variables** and add these for **Production** (and Preview, if you want preview deploys to work):

| Name | Value |
|---|---|
| `DATABASE_URL` | The Neon **pooled** connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` from Clerk |
| `CLERK_SECRET_KEY` | `sk_test_…` from Clerk |
| `STRIPE_SECRET_KEY` | `sk_test_…` from Stripe |
| `APP_URL` | `https://<project>.vercel.app` (no trailing slash) |
| `CRON_SECRET` | A long random string: run `openssl rand -hex 32` |
| `ADMIN_EMAILS` | Your email address, so your own account becomes an admin |
| `CLOUDINARY_URL` | `cloudinary://…` from Cloudinary |

4. Click **Deploy**. The first build takes 2–4 minutes.

**Check:** the site opens at `https://<project>.vercel.app`, the home page shows covers, and a chapter opens.

## 6. Stripe webhook

The webhook is how Stripe tells the site a purchase went through.

1. In Stripe, go to **Developers → Webhooks → Add endpoint** (in test mode).
2. Endpoint URL: `https://<project>.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. Open the new endpoint, reveal the **Signing secret** (`whsec_…`), and add it in Vercel as `STRIPE_WEBHOOK_SECRET`.
5. In Vercel, go to **Deployments**, open the latest one, and choose **⋯ → Redeploy** so the new variable takes effect.

## 7. Optional: Clerk webhook

Users are synced on their first request anyway. The webhook only keeps usernames current and removes deleted accounts.

1. In Clerk, go to **Configure → Webhooks → Add endpoint**: `https://<project>.vercel.app/api/webhooks/clerk`
2. Events: `user.updated` and `user.deleted`.
3. Copy the signing secret into Vercel as `CLERK_WEBHOOK_SIGNING_SECRET`, then redeploy.

## 8. Check everything

- [ ] **Guest:** open a novel, read chapter 1, then open a recent chapter and see the early-access paywall.
- [ ] **Try as a reader:** you're signed in with 25 credits. Unlock a chapter, and the balance drops by 5.
- [ ] **Buy credits:** on **Credits**, buy a pack and pay with card `4242 4242 4242 4242`, any future date and any CVC. Back on the site, the balance goes up once. In Stripe, the webhook endpoint shows a `200` delivery.
- [ ] **Library, review and comment** as the demo reader.
- [ ] **Try as an admin:** open the admin overview, edit a chapter, schedule it, and upload a cover image (this tests Cloudinary).
- [ ] **Your own account:** sign up with the email in `ADMIN_EMAILS`. You get the Admin link.
- [ ] **Nightly reset:** in Vercel, go to **Settings → Cron Jobs**, where `/api/cron/demo-reset` is listed. Click **Run** to test it now. It returns `{"ok":true,…}` in the logs.
- [ ] **Link preview:** paste the URL into a chat app or https://www.opengraph.xyz and the generated social image appears.

## 9. Finish up

- Put the live link in the GitHub repo's **About** box and at the top of `README.md`.
- Add `brand/og.png` as the repo's social preview: **Settings → General → Social preview**.
- Post using the kit in [`brand/`](../brand/README.md).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Every page is a 500 error, and the logs mention `DatabaseNotReachable` or `P1001` | `DATABASE_URL` is wrong or missing. Use the **pooled** Neon string, and check it ends with `?sslmode=require`. |
| Pages work, but there are no novels | The seed wasn't run against this database. Repeat step 1.3 with the **direct** string. |
| No "Try as a reader" buttons; the site is read-only | The Clerk keys are missing, or you haven't redeployed since adding them. `NEXT_PUBLIC_…` values are baked in at build time. |
| Buying credits fails, and the logs say `STRIPE_SECRET_KEY is required in production` | `STRIPE_SECRET_KEY` is missing. Production never falls back to simulated payments unless `ALLOW_FAKE_PAYMENTS=true`. |
| Payment succeeds, but credits only appear after returning to the site | The webhook isn't reaching the site. Check the endpoint URL and `STRIPE_WEBHOOK_SECRET`, then redeploy. The success redirect also adds the credits, so nobody is charged without receiving them. |
| Stripe redirects to `localhost` after checkout | `APP_URL` is still the default. Set it to the live URL and redeploy. |
| Cover upload says "Image uploads are not configured." | `CLOUDINARY_URL` is missing or malformed. |
| The cron run returns `401` | `CRON_SECRET` is missing in Vercel. Vercel sends it automatically once it's set. |
| The cron run times out | Resetting runs many queries. Make sure Vercel and Neon are in the same region. If it still times out, raise `maxDuration` in `src/app/api/cron/demo-reset/route.ts`. |
| Neon's free tier went to sleep, so the first request is slow | That's expected. Neon resumes in about a second. |

## Updating later

- **Code:** push to `main`, and Vercel deploys automatically. CI runs the tests on the same push.
- **Schema changes:** run the migrations before the code that needs them goes live: `DATABASE_URL="<direct>" pnpm db:deploy`.
- **New seed content:** `DATABASE_URL="<direct>" pnpm demo:reset` restores the catalogue and demo accounts and keeps real users' purchases.

Every variable is described in [`ENVIRONMENT.md`](ENVIRONMENT.md).

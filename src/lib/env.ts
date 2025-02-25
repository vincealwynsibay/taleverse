/**
 * Central place for configuration. Everything has a sensible local default so a
 * fresh clone runs with only `docker compose up`; production must set real values.
 */
export const env = {
  databaseUrl:
    process.env.DATABASE_URL ?? "postgresql://taleverse:taleverse@localhost:5432/taleverse",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  cloudinaryUrl: process.env.CLOUDINARY_URL,
  cronSecret: process.env.CRON_SECRET,
  isProduction: process.env.NODE_ENV === "production",
};

/** Stripe when configured; otherwise a fake provider that credits instantly (never in production). */
export function paymentsMode(): "stripe" | "fake" {
  if (env.stripeSecretKey) return "stripe";
  if (env.isProduction && process.env.ALLOW_FAKE_PAYMENTS !== "true") {
    throw new Error("STRIPE_SECRET_KEY is required in production");
  }
  return "fake";
}

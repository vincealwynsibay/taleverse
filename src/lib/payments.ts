import "server-only";
import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { env, paymentsMode } from "./env";
import { grantCredits } from "./credits";
import type { Viewer } from "./auth";

let stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!env.stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set");
  stripe ??= new Stripe(env.stripeSecretKey);
  return stripe;
}

type Pack = { id: number; name: string; credits: number; priceCents: number };

/**
 * Starts a credit purchase. With Stripe it returns a Checkout URL; with the
 * fake provider (local dev without keys) it credits immediately through the
 * same ledger function the webhook uses.
 */
export async function startCreditPurchase(viewer: Viewer, pack: Pack): Promise<{ redirectUrl: string }> {
  if (paymentsMode() === "fake") {
    await grantCredits(db, {
      userId: viewer.id,
      amount: pack.credits,
      kind: "PURCHASE",
      key: `fake:${randomUUID()}`,
      description: `${pack.name} pack (${pack.credits} credits, test mode)`,
    });
    return { redirectUrl: "/credits?purchase=success" };
  }

  const s = getStripe();
  const user = await db.user.findUniqueOrThrow({ where: { id: viewer.id } });
  let customer = user.stripeCustomerId;
  if (!customer) {
    customer = (await s.customers.create({ email: user.email, name: user.username, metadata: { userId: String(user.id) } })).id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer } });
  }

  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer,
    client_reference_id: String(viewer.id),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.priceCents,
          product_data: { name: `${pack.name}: ${pack.credits} Taleverse credits` },
        },
      },
    ],
    metadata: { userId: String(viewer.id), packId: String(pack.id), credits: String(pack.credits), packName: pack.name },
    success_url: `${env.appUrl}/credits?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/credits?purchase=cancelled`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { redirectUrl: session.url };
}

/**
 * Credits a paid Checkout Session exactly once. Called from the webhook and
 * from the success redirect (whichever arrives first wins; the other is a no-op).
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<"credited" | "duplicate" | "unpaid" | "invalid"> {
  if (session.payment_status !== "paid") return "unpaid";
  const userId = Number(session.metadata?.userId);
  const credits = Number(session.metadata?.credits);
  if (!Number.isInteger(userId) || !Number.isInteger(credits) || credits <= 0) return "invalid";
  const applied = await grantCredits(db, {
    userId,
    amount: credits,
    kind: "PURCHASE",
    key: `stripe:${session.id}`,
    description: `${session.metadata?.packName ?? "Credit"} pack (${credits} credits)`,
  });
  return applied ? "credited" : "duplicate";
}

export async function fulfillCheckoutSessionById(sessionId: string, userId: number) {
  if (paymentsMode() !== "stripe" || !sessionId.startsWith("cs_")) return;
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  // Only the buyer's own success page may trigger fulfilment of their session.
  if (session.metadata?.userId !== String(userId)) return;
  await fulfillCheckoutSession(session);
}

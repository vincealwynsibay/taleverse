import type Stripe from "stripe";
import { env } from "@/lib/env";
import { fulfillCheckoutSession, getStripe } from "@/lib/payments";

/**
 * Stripe webhook. Verifies the signature against the raw body, then credits
 * paid Checkout Sessions. Fulfilment is idempotent (ledger key per session),
 * so Stripe's retries and the success-page fallback can't double-credit.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !env.stripeWebhookSecret) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, env.stripeWebhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const result = await fulfillCheckoutSession(event.data.object);
      return Response.json({ received: true, result });
    }
    default:
      // Acknowledge everything else so Stripe doesn't retry it.
      return Response.json({ received: true, ignored: event.type });
  }
}

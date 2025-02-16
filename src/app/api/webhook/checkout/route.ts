import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const endpointSecret = process.env.STRIPE_SECRET_WEBHOOK_KEY!;
  const sig = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return new Response(`Webhook error: ${err}`, { status: 400 });
  }

  const eventType = event.type;

  if (
    eventType !== "checkout.session.completed" &&
    eventType !== "checkout.session.async_payment_succeeded"
  ) {
    return new Response("Event type not handled", { status: 400 });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (!userId) {
      return new Response("User ID is missing in metadata", { status: 400 });
    }

    if (session.mode === "subscription") {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { stripeSubscriptionId: true },
      });

      if (!existingUser?.stripeSubscriptionId) {
        // Initial subscription
        await prisma.user.update({
          where: { id: parseInt(userId) },
          data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          },
        });
      } else {
        // Subscription update
        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          },
        });
      }
    } else if (session.mode === "payment") {
      // Handle coin purchases
      const creditOfferId = session.metadata?.creditOfferId;

      if (!creditOfferId) {
        return new Response("Credit offer ID is missing in metadata", {
          status: 400,
        });
      }

      const creditOffer = await prisma.creditOffers.findUnique({
        where: { id: parseInt(creditOfferId) },
      });

      if (!creditOffer) {
        return new Response("Invalid credit offer ID", { status: 400 });
      }

      await prisma.creditTransaction.create({
        data: {
          userId: parseInt(userId),
          stripe_payment_id: session.payment_intent as string,
          credit: creditOffer.credit,
          type: "BUY",
        },
      });
    }

    return new Response("Success", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error", error);
    return new Response("Server error", { status: 500 });
  }
}

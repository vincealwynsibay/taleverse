import { Subscription } from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { stripe } from "../stripe";
import { checkUser } from "./common";
import prisma from "../db";

export async function getPlans() {
  const stripe = new Stripe(`${process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!}`);
  try {
    const prices = await stripe.prices.list({
      expand: ["data.product"],
      active: true,
      type: "recurring",
    });

    console.log(prices);

    const plans: Subscription[] = prices.data.map((price) => {
      const product = price.product as Stripe.Product;
      return {
        id: price.id,
        name: product.name,
        description: product.description,
        price: price.unit_amount,
        interval: price.recurring?.interval,
        price_id: price.id,
      };
    });

    return {
      data: plans,
    };
  } catch (error) {
    console.error(error);
    return { error: "Error fetching subscription plans" };
  }
}

export async function createCustomer(email: string) {
  const customer = await stripe.customers.create({
    email,
  });

  return {
    data: {
      stripeId: customer.id,
    },
  };
}

export async function purchaseCredit(priceId: string, creditId: string) {
  const isValidUser = await checkUser();
  if (!isValidUser.success) {
    return isValidUser;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: isValidUser.data!.id,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const lineItems = [
    {
      price: priceId,
      quantity: 1,
    },
  ];

  const session = await stripe.checkout.sessions.create({
    customer: user.stripeId,
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/billing}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancelled`,
    payment_intent_data: {
      metadata: {
        userId: user.id,
        creditId,
      },
    },
  });

  return {
    data: {
      sessionId: session.id,
    },
  };
}

export async function createCheckoutSession(priceId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return {
    data: {
      sessionId: session.id,
    },
  };
}

export async function subscribeToPlan(priceId: string) {
  const isValidUser = await checkUser();
  if (!isValidUser.success) {
    return isValidUser;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: isValidUser.data!.id,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const subscription = await stripe.checkout.sessions.create({
    customer: user.stripeId,
    mode: "subscription",
    payment_method_types: ["card"],
    items: [
      {
        price: priceId,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/billing`,
    cancel_url: `${process.env.CLIENT_URL}/billing`,
    metadata: {
      userId: user.id,
    },
  });

  return {
    data: {
      subscriptionId: subscription.id,
    },
  };
}

export async function openCustomerPortal(userStripeId: string) {
  let redirectUrl: string = "";

  try {
    // const billingUrl = absoluteUrl("/dashboard/billing");
    if (userStripeId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userStripeId,
        return_url: "/",
      });

      redirectUrl = stripeSession.url as string;
    }
  } catch {
    throw new Error("Failed to generate user stripe session");
  }

  redirect(redirectUrl);
}

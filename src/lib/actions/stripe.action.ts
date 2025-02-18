"use server";

import { Subscription } from "@/types/types";
import Stripe from "stripe";
import { stripe } from "../stripe";
import { redirect } from "next/navigation";
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

export async function createCheckoutSession(priceId: string) {
  const user = await checkUser();
  console.log("user", user);
  if (!user.success || !user.data) {
    throw new Error("User not found");
  }

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
    customer_email: user.data.email,
    metadata: {
      userId: user.data.id,
      priceId,
    },
  });

  return {
    data: {
      sessionId: session.id,
    },
  };
}

export async function openCustomerPortal(userStripeId: string) {
  let redirectUrl: string = "";

  console.log(userStripeId);
  try {
    // const billingUrl = absoluteUrl("/dashboard/billing");
    if (userStripeId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userStripeId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
      });
      console.log(stripeSession);

      redirectUrl = stripeSession.url as string;
    }
  } catch (e) {
    console.log(e);
    throw new Error("Failed to generate user stripe session");
  }
  redirect(redirectUrl);
}

// Purchase coins
export async function purchaseCoins(userId: number, creditOfferId: number) {
  const creditOffer = await prisma.creditOffers.findUnique({
    where: { id: creditOfferId },
  });

  if (!creditOffer) {
    throw new Error("Invalid credit offer ID");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) {
    throw new Error("User does not have a Stripe customer ID");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer: user.stripeCustomerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Purchase ${creditOffer.credit} Coins` },
          unit_amount: creditOffer.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.APP_URL}/success`,
    cancel_url: `${process.env.APP_URL}/cancel`,
    metadata: {
      userId: userId.toString(),
      creditOfferId: creditOfferId.toString(),
    },
  });

  return session.url;
}

// Buy a chapter
export async function buyChapter(userId: number, chapterId: number) {
  const existingPurchase = await prisma.purchasedChapter.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  if (existingPurchase) {
    throw new Error("Chapter already purchased");
  }

  await prisma.purchasedChapter.create({
    data: {
      userId,
      chapterId,
    },
  });

  return { message: "Chapter purchased successfully" };
}

// check if user is authorized to view chapter
export async function isAuthorized(clerkId: string, slug: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    return { message: "User not found", success: false };
  }

  // // check stripe subscription
  if (user.stripeSubscriptionId && user.stripeCurrentPeriodEnd! > new Date()) {
    return { message: "User is authorized", success: true };
  }

  // check if user has purchased chapter
  const chapter = await prisma.chapter.findUnique({ where: { slug } });

  if (!chapter) {
    return { message: "Chapter not found", success: false };
  }

  const existingPurchase = await prisma.purchasedChapter.findUnique({
    where: { userId_chapterId: { userId: user.id, chapterId: chapter.id } },
  });

  if (!existingPurchase) {
    return { message: "User is not authorized", success: false };
  }

  return { message: "User is authorized", success: true };
}

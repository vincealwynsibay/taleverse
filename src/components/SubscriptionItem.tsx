"use client";

import { createCheckoutSession } from "@/lib/actions/stripe.action";
import { Subscription } from "@/types/types";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "./ui/button";
export default function SubscriptionItem({ plan }: { plan: Subscription }) {
  const handleSubmit = async () => {
    const stripe = await loadStripe(
      `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}`
    );
    if (!stripe) {
      return;
    }

    try {
      const res = await createCheckoutSession(plan.price_id);
      if (!res.data) {
        return;
      }
      await stripe.redirectToCheckout({
        sessionId: res.data.sessionId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>{plan.name}</h1>
      <p>{plan.price && plan.price / 100}</p>
      <Button onClick={handleSubmit}>
        Upgrade in {plan.price && plan.price / 100}
      </Button>
    </div>
  );
}

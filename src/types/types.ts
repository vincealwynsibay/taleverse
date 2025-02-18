import Stripe from "stripe";

export type FormState = {
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields?: Record<string, any>;
  success?: boolean;
};

export type Subscription = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  interval: Stripe.Price.Recurring.Interval | undefined;
  price_id: string;
};

export type StripeMetadata = {
  userId: string;
  priceId: string;
};

// type for Chapter but no content, only the essential parts for chapter list
export type ChapterMetadata = {
  id: number;
  title: string;
  slug: string;
  order_number: number;
  publishedAt: Date | null;
  publicAt: Date | null;
  isSubscribed?: boolean | undefined;
  isBought?: boolean | undefined;
};

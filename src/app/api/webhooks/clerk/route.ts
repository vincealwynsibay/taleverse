import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Keeps local user rows in sync with Clerk. Creation also happens lazily on
 * first request (lib/auth.ts), so this mostly handles updates and deletes.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.updated") {
    const u = evt.data;
    const email = u.email_addresses.find((e) => e.id === u.primary_email_address_id)?.email_address;
    await db.user.updateMany({
      where: { clerkId: u.id },
      data: {
        ...(email && { email }),
        username: u.username ?? u.first_name ?? undefined,
        imageUrl: u.image_url,
      },
    });
  } else if (evt.type === "user.deleted" && evt.data.id) {
    await db.user.deleteMany({ where: { clerkId: evt.data.id, isDemo: false } });
  }

  return new Response("ok");
}

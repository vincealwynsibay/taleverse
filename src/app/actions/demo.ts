"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, run } from "@/lib/action";
import { prepareDemoUser } from "@/lib/seed";
import { authEnabled } from "@/lib/flags";

const personas = {
  reader: { email: "demo-reader@taleverse.dev", firstName: "Demo", lastName: "Reader", username: "demo_reader", role: "USER" },
  admin: { email: "demo-admin@taleverse.dev", firstName: "Demo", lastName: "Admin", username: "demo_admin", role: "ADMIN" },
} as const;

export type Persona = keyof typeof personas;

/**
 * One-click demo: finds or creates the shared demo account in Clerk and
 * returns a short-lived sign-in ticket the client exchanges for a session.
 */
export async function startDemoAction(persona: Persona) {
  return run(async () => {
    if (!authEnabled || process.env.DEMO_ENABLED === "false") return fail("The demo is turned off on this server.");
    const p = personas[z.enum(["reader", "admin"]).parse(persona)];
    const clerk = await clerkClient();

    const existing = await clerk.users.getUserList({ emailAddress: [p.email], limit: 1 });
    const clerkUser =
      existing.data[0] ??
      (await clerk.users.createUser({
        emailAddress: [p.email],
        firstName: p.firstName,
        lastName: p.lastName,
        skipPasswordRequirement: true,
        skipLegalChecks: true,
      }));

    const user = await db.user.upsert({
      where: { email: p.email },
      update: { clerkId: clerkUser.id, isDemo: true, role: p.role },
      create: { clerkId: clerkUser.id, email: p.email, username: p.username, isDemo: true, role: p.role },
      include: { _count: { select: { ledger: true } } },
    });
    if (user._count.ledger === 0) await prepareDemoUser(db, user.id);

    const token = await clerk.signInTokens.createSignInToken({ userId: clerkUser.id, expiresInSeconds: 120 });
    return ok({ ticket: token.token });
  });
}

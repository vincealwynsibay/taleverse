import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { grantCredits } from "./credits";

export const WELCOME_CREDITS = 10;

export type Viewer = {
  id: number;
  clerkId: string;
  username: string;
  imageUrl: string | null;
  isAdmin: boolean;
  isDemo: boolean;
};

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/**
 * Creates the local user row the first time we see a Clerk user. The Clerk
 * webhook does the same; doing it lazily as well means local dev (no public
 * webhook URL) and a missed webhook both just work.
 */
async function syncUser(clerkId: string) {
  const cu = await currentUser();
  if (!cu || cu.id !== clerkId) return null;
  const email = (cu.primaryEmailAddress ?? cu.emailAddresses[0])?.emailAddress ?? `${clerkId}@users.taleverse.local`;
  const username = cu.username ?? cu.firstName ?? email.split("@")[0];
  try {
    const user = await db.user.create({
      data: {
        clerkId,
        email,
        username,
        imageUrl: cu.imageUrl,
        role: adminEmails().includes(email.toLowerCase()) ? "ADMIN" : "USER",
      },
    });
    await grantCredits(db, {
      userId: user.id,
      amount: WELCOME_CREDITS,
      kind: "GRANT",
      key: `welcome:${user.id}`,
      description: "Welcome bonus",
    });
    return user;
  } catch (e) {
    // Another request created it first.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return db.user.findUnique({ where: { clerkId } });
    }
    throw e;
  }
}

/** The signed-in reader, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const user = (await db.user.findUnique({ where: { clerkId: userId } })) ?? (await syncUser(userId));
  if (!user) return null;
  return {
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    imageUrl: user.imageUrl,
    isAdmin: user.role === "ADMIN",
    isDemo: user.isDemo,
  };
});

export class AuthError extends Error {
  constructor(public readonly reason: "signed-out" | "forbidden") {
    super(reason === "signed-out" ? "Sign in to continue." : "You don't have permission to do that.");
  }
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new AuthError("signed-out");
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.isAdmin) throw new AuthError("forbidden");
  return viewer;
}

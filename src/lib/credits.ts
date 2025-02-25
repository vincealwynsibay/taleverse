import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { LedgerKind } from "@/generated/prisma/enums";
import { chapterAccess } from "./access";
import type { Db, Tx } from "./db";

/**
 * The credit ledger. Entries are append-only; a balance is SUM(delta).
 * Every write carries an idempotency key, so retried webhooks and
 * double-clicked buttons can't create duplicate entries.
 */

export async function getBalance(db: Db | Tx, userId: number): Promise<number> {
  const agg = await db.creditLedgerEntry.aggregate({ where: { userId }, _sum: { delta: true } });
  return agg._sum.delta ?? 0;
}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** Adds credits. Returns false if this idempotency key was already applied. */
export async function grantCredits(
  db: Db,
  input: { userId: number; amount: number; kind: Extract<LedgerKind, "PURCHASE" | "GRANT" | "REFUND">; key: string; description: string },
): Promise<boolean> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("amount must be a positive integer");
  try {
    await db.creditLedgerEntry.create({
      data: {
        userId: input.userId,
        delta: input.amount,
        kind: input.kind,
        idempotencyKey: input.key,
        description: input.description,
      },
    });
    return true;
  } catch (e) {
    if (isUniqueViolation(e)) return false;
    throw e;
  }
}

export type UnlockResult =
  | { ok: true; balance: number; alreadyUnlocked: boolean }
  | { ok: false; reason: "insufficient-credits"; balance: number; price: number }
  | { ok: false; reason: "not-for-sale" | "not-found" };

/**
 * Spends credits to unlock an early-access chapter, atomically.
 *
 * The user row is locked with SELECT … FOR UPDATE, so concurrent unlocks by the
 * same user serialize: the balance check and the debit can't interleave, and
 * the balance can never go negative. The (userId, chapterId) primary key on
 * ChapterUnlock plus the idempotency key make a repeat unlock a no-op.
 */
export async function unlockChapter(db: Db, userId: number, chapterId: number, now = new Date()): Promise<UnlockResult> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

    const chapter = await tx.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, number: true, publishedAt: true, freeAt: true, unlockPrice: true, novel: { select: { title: true } } },
    });
    if (!chapter) return { ok: false, reason: "not-found" } as const;

    const existing = await tx.chapterUnlock.findUnique({ where: { userId_chapterId: { userId, chapterId } } });
    if (existing) return { ok: true, balance: await getBalance(tx, userId), alreadyUnlocked: true } as const;

    const access = chapterAccess(chapter, { isAdmin: false, hasUnlocked: false }, now);
    if (access.kind !== "locked") return { ok: false, reason: "not-for-sale" } as const;

    const balance = await getBalance(tx, userId);
    if (balance < access.price) {
      return { ok: false, reason: "insufficient-credits", balance, price: access.price } as const;
    }

    const entry = await tx.creditLedgerEntry.create({
      data: {
        userId,
        delta: -access.price,
        kind: "SPEND",
        idempotencyKey: `unlock:${userId}:${chapterId}`,
        description: `Unlocked ${chapter.novel.title} · Chapter ${chapter.number}`,
      },
    });
    await tx.chapterUnlock.create({ data: { userId, chapterId, ledgerEntryId: entry.id } });

    return { ok: true, balance: balance - access.price, alreadyUnlocked: false } as const;
  });
}

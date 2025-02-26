import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "../db";
import { getBalance, unlockChapter } from "../credits";
import { DEMO_STARTING_CREDITS, prepareDemoUser, resetDemo } from ".";
import { catalog } from "./catalog";
import { TEST_DATABASE_URL } from "@/test/global-setup";

const db = createClient(TEST_DATABASE_URL);
const quiet = { log: () => {} };

afterAll(() => db.$disconnect());

beforeAll(async () => {
  await db.$executeRawUnsafe(`TRUNCATE "User", "Novel", "Genre", "Chapter", "CreditPack" RESTART IDENTITY CASCADE`);
  await resetDemo(db, quiet);
}, 60_000);

describe("resetDemo", () => {
  it("seeds the whole catalogue with live early-access chapters", async () => {
    expect(await db.novel.count()).toBe(catalog.length);
    const ongoing = catalog.filter((b) => b.schedule === "ongoing").length;
    const now = new Date();
    const early = await db.chapter.count({ where: { publishedAt: { lte: now }, freeAt: { gt: now } } });
    const scheduled = await db.chapter.count({ where: { publishedAt: { gt: now } } });
    expect(early).toBe(ongoing * 3);
    expect(scheduled).toBe(ongoing * 2);
  });

  it("restores demo accounts and removes admin-made content, but keeps real users' data", async () => {
    const demo = await db.user.create({ data: { clerkId: "demo", email: "demo@test.dev", username: "demo", isDemo: true } });
    const real = await db.user.create({ data: { clerkId: "real", email: "real@test.dev", username: "real" } });
    await prepareDemoUser(db, demo.id);
    await prepareDemoUser(db, real.id);

    const chapter = await db.chapter.findFirstOrThrow({ where: { publishedAt: { lte: new Date() }, freeAt: { gt: new Date() } } });
    expect((await unlockChapter(db, demo.id, chapter.id)).ok).toBe(true);
    expect((await unlockChapter(db, real.id, chapter.id)).ok).toBe(true);
    await db.comment.create({ data: { userId: demo.id, chapterId: chapter.id, body: "spam" } });
    await db.novel.create({ data: { title: "Vandalism", slug: "vandalism", author: "x", synopsis: "x" } });

    await resetDemo(db, quiet);

    expect(await getBalance(db, demo.id)).toBe(DEMO_STARTING_CREDITS);
    expect(await db.chapterUnlock.count({ where: { userId: demo.id } })).toBe(0);
    expect(await db.comment.count({ where: { userId: demo.id } })).toBe(0);
    expect(await db.novel.findUnique({ where: { slug: "vandalism" } })).toBeNull();
    // Real readers keep what they paid for.
    expect(await db.chapterUnlock.count({ where: { userId: real.id } })).toBe(1);
    expect(await getBalance(db, real.id)).toBe(DEMO_STARTING_CREDITS - chapter.unlockPrice);
  }, 60_000);
});

describe("seeded store activity", () => {
  it("gives seeded readers purchases and early-access unlocks without overspending", async () => {
    const readers = await db.user.findMany({ where: { clerkId: { startsWith: "seed:" } }, select: { id: true } });
    expect(readers.length).toBeGreaterThan(0);
    expect(await db.creditLedgerEntry.count({ where: { kind: "PURCHASE", userId: { in: readers.map((r) => r.id) } } })).toBe(readers.length);
    expect(await db.chapterUnlock.count({ where: { userId: { in: readers.map((r) => r.id) } } })).toBeGreaterThan(0);
    for (const r of readers) expect(await getBalance(db, r.id)).toBeGreaterThanOrEqual(0);

    // Re-running the reset replaces the activity rather than duplicating it.
    const before = await db.creditLedgerEntry.count();
    await resetDemo(db, quiet);
    expect(await db.creditLedgerEntry.count()).toBe(before);
  }, 60_000);
});

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createClient } from "./db";
import { getBalance, grantCredits, unlockChapter } from "./credits";
import { TEST_DATABASE_URL } from "@/test/global-setup";

/** Integration tests against a real Postgres (see docker-compose.yml). */
const db = createClient(TEST_DATABASE_URL);
const DAY = 86_400_000;

afterAll(() => db.$disconnect());

let userId: number;
let earlyIds: number[];
let freeId: number;

beforeEach(async () => {
  await db.$executeRawUnsafe(
    `TRUNCATE "User", "Novel", "Chapter", "CreditLedgerEntry", "ChapterUnlock" RESTART IDENTITY CASCADE`,
  );
  const user = await db.user.create({ data: { clerkId: "u1", email: "u1@test.dev", username: "u1" } });
  userId = user.id;
  const novel = await db.novel.create({ data: { title: "Test", slug: "test", author: "A", synopsis: "" } });
  const now = Date.now();
  const early = await Promise.all(
    [1, 2, 3, 4].map((number) =>
      db.chapter.create({
        data: { novelId: novel.id, number, title: `Ch ${number}`, publishedAt: new Date(now - DAY), freeAt: new Date(now + 5 * DAY), unlockPrice: 5 },
      }),
    ),
  );
  earlyIds = early.map((c) => c.id);
  freeId = (
    await db.chapter.create({ data: { novelId: novel.id, number: 5, title: "Free", publishedAt: new Date(now - 9 * DAY) } })
  ).id;
});

describe("grantCredits", () => {
  it("is idempotent per key (webhook retries can't double-credit)", async () => {
    const input = { userId, amount: 20, kind: "PURCHASE" as const, key: "stripe:cs_123", description: "Pack" };
    expect(await grantCredits(db, input)).toBe(true);
    expect(await grantCredits(db, input)).toBe(false);
    expect(await getBalance(db, userId)).toBe(20);
  });

  it("rejects non-positive amounts", async () => {
    await expect(grantCredits(db, { userId, amount: 0, kind: "GRANT", key: "x", description: "" })).rejects.toThrow();
  });
});

describe("unlockChapter", () => {
  it("debits the price and records the unlock", async () => {
    await grantCredits(db, { userId, amount: 12, kind: "GRANT", key: "g", description: "" });
    const res = await unlockChapter(db, userId, earlyIds[0]);
    expect(res).toEqual({ ok: true, balance: 7, alreadyUnlocked: false });
    expect(await db.chapterUnlock.count({ where: { userId } })).toBe(1);
  });

  it("refuses when the balance is too low and writes nothing", async () => {
    await grantCredits(db, { userId, amount: 4, kind: "GRANT", key: "g", description: "" });
    expect(await unlockChapter(db, userId, earlyIds[0])).toMatchObject({ ok: false, reason: "insufficient-credits", balance: 4, price: 5 });
    expect(await getBalance(db, userId)).toBe(4);
  });

  it("does not charge twice for the same chapter", async () => {
    await grantCredits(db, { userId, amount: 20, kind: "GRANT", key: "g", description: "" });
    await unlockChapter(db, userId, earlyIds[0]);
    expect(await unlockChapter(db, userId, earlyIds[0])).toMatchObject({ ok: true, alreadyUnlocked: true, balance: 15 });
  });

  it("won't sell a chapter that is already free", async () => {
    await grantCredits(db, { userId, amount: 20, kind: "GRANT", key: "g", description: "" });
    expect(await unlockChapter(db, userId, freeId)).toEqual({ ok: false, reason: "not-for-sale" });
  });

  it("never overspends under concurrent unlocks", async () => {
    // Enough for exactly two of four chapters, all requested at once.
    await grantCredits(db, { userId, amount: 10, kind: "GRANT", key: "g", description: "" });
    const results = await Promise.all(earlyIds.map((id) => unlockChapter(db, userId, id)));
    expect(results.filter((r) => r.ok)).toHaveLength(2);
    expect(await getBalance(db, userId)).toBe(0);
    expect(await db.chapterUnlock.count({ where: { userId } })).toBe(2);
  });

  it("is safe against a double-click on the same chapter", async () => {
    await grantCredits(db, { userId, amount: 50, kind: "GRANT", key: "g", description: "" });
    const results = await Promise.all(Array.from({ length: 5 }, () => unlockChapter(db, userId, earlyIds[0])));
    expect(results.every((r) => r.ok)).toBe(true);
    expect(await getBalance(db, userId)).toBe(45);
  });
});

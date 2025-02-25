import { describe, expect, it } from "vitest";
import { canRead, chapterAccess, chapterState } from "./access";

const now = new Date("2026-06-01T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);
const reader = { isAdmin: false, hasUnlocked: false };

describe("chapterState", () => {
  it("is a draft without a publish date", () => {
    expect(chapterState({ publishedAt: null, freeAt: null }, now)).toBe("draft");
  });
  it("is scheduled until publishedAt", () => {
    expect(chapterState({ publishedAt: days(1), freeAt: null }, now)).toBe("scheduled");
  });
  it("is early access between publishedAt and freeAt", () => {
    expect(chapterState({ publishedAt: days(-1), freeAt: days(3) }, now)).toBe("early-access");
  });
  it("is free once freeAt passes, or with no freeAt", () => {
    expect(chapterState({ publishedAt: days(-9), freeAt: days(-2) }, now)).toBe("free");
    expect(chapterState({ publishedAt: days(-9), freeAt: null }, now)).toBe("free");
  });
  it("treats the exact publish instant as published", () => {
    expect(chapterState({ publishedAt: now, freeAt: null }, now)).toBe("free");
  });
});

describe("chapterAccess", () => {
  const early = { publishedAt: days(-1), freeAt: days(6), unlockPrice: 5 };

  it("locks early-access chapters with their price and free date", () => {
    expect(chapterAccess(early, reader, now)).toEqual({ kind: "locked", price: 5, freeAt: days(6) });
  });
  it("opens early-access chapters the reader has unlocked", () => {
    const a = chapterAccess(early, { ...reader, hasUnlocked: true }, now);
    expect(a.kind).toBe("unlocked");
    expect(canRead(a)).toBe(true);
  });
  it("never shows unpublished chapters to readers, even if unlocked", () => {
    const scheduled = { publishedAt: days(2), freeAt: days(9), unlockPrice: 5 };
    expect(chapterAccess(scheduled, { ...reader, hasUnlocked: true }, now).kind).toBe("unavailable");
  });
  it("lets admins read everything, including drafts", () => {
    const draft = { publishedAt: null, freeAt: null, unlockPrice: 5 };
    expect(canRead(chapterAccess(draft, { isAdmin: true, hasUnlocked: false }, now))).toBe(true);
  });
});

/**
 * Who may read a chapter. Pure so it's trivially testable and shared by the
 * chapter list, the reader page and the unlock action.
 *
 *   draft/scheduled ──publishedAt──▶ early access ──freeAt──▶ free
 *                                    (unlock with credits)
 */
export type ChapterTiming = {
  publishedAt: Date | null;
  freeAt: Date | null;
};

export type ChapterState = "draft" | "scheduled" | "early-access" | "free";

export function chapterState(c: ChapterTiming, now = new Date()): ChapterState {
  if (!c.publishedAt) return "draft";
  if (c.publishedAt > now) return "scheduled";
  if (c.freeAt && c.freeAt > now) return "early-access";
  return "free";
}

export type Access =
  | { kind: "free" }
  | { kind: "unlocked" } // bought with credits
  | { kind: "staff" } // admins read everything, including drafts
  | { kind: "locked"; price: number; freeAt: Date }
  | { kind: "unavailable" }; // not published yet

export function chapterAccess(
  c: ChapterTiming & { unlockPrice: number },
  viewer: { isAdmin: boolean; hasUnlocked: boolean },
  now = new Date(),
): Access {
  if (viewer.isAdmin) return { kind: "staff" };
  const state = chapterState(c, now);
  switch (state) {
    case "draft":
    case "scheduled":
      return { kind: "unavailable" };
    case "free":
      return { kind: "free" };
    case "early-access":
      return viewer.hasUnlocked
        ? { kind: "unlocked" }
        : { kind: "locked", price: c.unlockPrice, freeAt: c.freeAt! };
  }
}

export const canRead = (a: Access) => a.kind === "free" || a.kind === "unlocked" || a.kind === "staff";

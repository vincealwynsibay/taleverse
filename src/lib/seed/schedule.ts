const DAY = 24 * 60 * 60 * 1000;

export type Slot = { publishedAt: Date; freeAt: Date | null };

/**
 * Release dates for a seeded novel, relative to `now`, so the demo always has
 * fresh early-access chapters and upcoming releases after every reset.
 *
 * complete: every chapter free, released weekly in the past.
 * ongoing (newest last):
 *   …free back catalogue (every 3 days)
 *   3 early-access chapters, released 5/3/1 days ago, free 7 days after release
 *   2 scheduled chapters, releasing in 2 and 5 days
 */
export function buildSchedule(count: number, mode: "complete" | "ongoing", now = new Date()): Slot[] {
  const t = now.getTime();
  const at = (offsetDays: number) => new Date(t + offsetDays * DAY);

  return Array.from({ length: count }, (_, i) => {
    const fromEnd = count - 1 - i; // 0 = newest
    if (mode === "complete") return { publishedAt: at(-30 - fromEnd * 7), freeAt: null };

    if (fromEnd <= 1) {
      const publishedAt = at(fromEnd === 1 ? 2 : 5);
      return { publishedAt, freeAt: new Date(publishedAt.getTime() + 7 * DAY) };
    }
    if (fromEnd <= 4) {
      const publishedAt = at(-(fromEnd - 1) * 2 + 1); // fromEnd 2,3,4 -> -1,-3,-5 days
      return { publishedAt, freeAt: new Date(publishedAt.getTime() + 7 * DAY) };
    }
    return { publishedAt: at(-5 - (fromEnd - 4) * 3), freeAt: null };
  });
}

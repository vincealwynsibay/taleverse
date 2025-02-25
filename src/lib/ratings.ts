import type { Db, Tx } from "./db";

/**
 * Recomputes a novel's cached rating from its reviews. Raw SQL so it doesn't
 * bump Novel.updatedAt: a new review isn't a content update.
 */
export async function refreshRating(db: Db | Tx, novelId: number) {
  await db.$executeRaw`
    UPDATE "Novel" n SET
      "ratingAvg" = COALESCE((SELECT AVG(rating)::float FROM "Review" WHERE "novelId" = ${novelId}), 0),
      "ratingCount" = (SELECT COUNT(*)::int FROM "Review" WHERE "novelId" = ${novelId})
    WHERE n.id = ${novelId}`;
}

import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { chapterAccess, chapterState, type ChapterState } from "./access";
import { asBlocks, previewBlocks, type Block } from "./blocks";
import { getBalance } from "./credits";
import type { Viewer } from "./auth";

/** Readers only ever see chapters whose publish date has passed. */
const published = (now = new Date()): Prisma.ChapterWhereInput => ({ publishedAt: { lte: now } });

export const novelCardSelect = {
  id: true,
  slug: true,
  title: true,
  author: true,
  synopsis: true,
  coverUrl: true,
  coverHue: true,
  status: true,
  ratingAvg: true,
  ratingCount: true,
  views: true,
  genres: { select: { name: true, slug: true } },
} satisfies Prisma.NovelSelect;

export type NovelCardData = Prisma.NovelGetPayload<{ select: typeof novelCardSelect }> & { chapterCount?: number };

async function withChapterCounts<T extends { id: number }>(novels: T[], now = new Date()) {
  const counts = await db.chapter.groupBy({
    by: ["novelId"],
    where: { novelId: { in: novels.map((n) => n.id) }, ...published(now) },
    _count: true,
  });
  const byId = new Map(counts.map((c) => [c.novelId, c._count]));
  return novels.map((n) => ({ ...n, chapterCount: byId.get(n.id) ?? 0 }));
}

export const getGenres = cache(() =>
  db.genre.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { novels: true } } } }),
);

// ─── Home ────────────────────────────────────────────────────────────────────

export async function getHomeData(viewer: Viewer | null) {
  const now = new Date();
  const [featured, latest, topRated, earlyAccess, continueReading, novelCount, chapterCount] = await Promise.all([
    db.novel.findMany({ select: novelCardSelect, orderBy: { views: "desc" }, take: 5 }),
    db.chapter.findMany({
      where: published(now),
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: {
        id: true,
        number: true,
        title: true,
        publishedAt: true,
        freeAt: true,
        novel: { select: { slug: true, title: true, coverUrl: true, coverHue: true, author: true } },
      },
    }),
    db.novel.findMany({ select: novelCardSelect, orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }], take: 6 }),
    db.chapter.count({ where: { ...published(now), freeAt: { gt: now } } }),
    viewer ? getContinueReading(viewer.id, 4) : Promise.resolve([]),
    db.novel.count(),
    db.chapter.count({ where: published(now) }),
  ]);
  return {
    featured: await withChapterCounts(featured, now),
    latest,
    topRated: await withChapterCounts(topRated, now),
    earlyAccessCount: earlyAccess,
    continueReading,
    novelCount,
    chapterCount,
  };
}

export async function getContinueReading(userId: number, take = 12) {
  const rows = await db.readingProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      position: true,
      updatedAt: true,
      chapter: { select: { number: true, title: true } },
      novel: { select: { ...novelCardSelect, _count: { select: { chapters: { where: published() } } } } },
    },
  });
  return rows.map((r) => ({ ...r, totalChapters: r.novel._count.chapters }));
}

// ─── Browse ──────────────────────────────────────────────────────────────────

export const sortOptions = {
  popular: { label: "Most read", orderBy: { views: "desc" } },
  rating: { label: "Top rated", orderBy: { ratingAvg: "desc" } },
  updated: { label: "Recently updated", orderBy: { updatedAt: "desc" } },
  title: { label: "Title A–Z", orderBy: { title: "asc" } },
} as const satisfies Record<string, { label: string; orderBy: Prisma.NovelOrderByWithRelationInput }>;

export type SortKey = keyof typeof sortOptions;

export async function listNovels(opts: { q?: string; genre?: string; status?: string; sort?: string }) {
  const sort: SortKey = opts.sort && opts.sort in sortOptions ? (opts.sort as SortKey) : "popular";
  const status = opts.status === "ONGOING" || opts.status === "COMPLETED" ? opts.status : undefined;
  const q = opts.q?.trim();
  const novels = await db.novel.findMany({
    where: {
      ...(q && {
        OR: [{ title: { contains: q, mode: "insensitive" } }, { author: { contains: q, mode: "insensitive" } }],
      }),
      ...(opts.genre && { genres: { some: { slug: opts.genre } } }),
      ...(status && { status }),
    },
    select: novelCardSelect,
    orderBy: [sortOptions[sort].orderBy, { id: "asc" }],
  });
  return { novels: await withChapterCounts(novels), sort, status };
}

export async function searchNovels(q: string) {
  if (!q.trim()) return [];
  return db.novel.findMany({
    where: {
      OR: [{ title: { contains: q, mode: "insensitive" } }, { author: { contains: q, mode: "insensitive" } }],
    },
    select: { slug: true, title: true, author: true, coverUrl: true, coverHue: true },
    take: 6,
    orderBy: { views: "desc" },
  });
}

// ─── Novel page ──────────────────────────────────────────────────────────────

export const getNovel = cache(async (slug: string) =>
  db.novel.findUnique({ where: { slug }, select: { ...novelCardSelect, releaseYear: true, createdAt: true } }),
);

export async function getNovelViewerState(novelId: number, viewer: Viewer | null) {
  const now = new Date();
  const [first, latest, stats, inLibrary, progress, myReview] = await Promise.all([
    db.chapter.findFirst({ where: { novelId, ...published(now) }, orderBy: { number: "asc" }, select: { number: true } }),
    db.chapter.findFirst({ where: { novelId, ...published(now) }, orderBy: { number: "desc" }, select: { number: true, publishedAt: true } }),
    db.chapter.aggregate({ where: { novelId, ...published(now) }, _sum: { wordCount: true }, _count: true }),
    viewer ? db.libraryEntry.findUnique({ where: { userId_novelId: { userId: viewer.id, novelId } } }) : null,
    viewer
      ? db.readingProgress.findUnique({
          where: { userId_novelId: { userId: viewer.id, novelId } },
          select: { position: true, chapter: { select: { number: true } } },
        })
      : null,
    viewer ? db.review.findUnique({ where: { userId_novelId: { userId: viewer.id, novelId } } }) : null,
  ]);
  return {
    firstChapter: first?.number ?? null,
    latestChapter: latest?.number ?? null,
    lastUpdated: latest?.publishedAt ?? null,
    chapterCount: stats._count,
    wordCount: stats._sum.wordCount ?? 0,
    inLibrary: Boolean(inLibrary),
    progress,
    myReview,
  };
}

export type ChapterListItem = {
  id: number;
  number: number;
  title: string;
  publishedAt: Date | null;
  freeAt: Date | null;
  unlockPrice: number;
  wordCount: number;
  state: ChapterState;
  unlocked: boolean;
};

export async function getChapterList(
  novelId: number,
  viewer: Viewer | null,
  opts: { page?: number; perPage?: number; order?: "asc" | "desc" } = {},
) {
  const now = new Date();
  const perPage = opts.perPage ?? 50;
  const total = await db.chapter.count({ where: { novelId, ...published(now) } });
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, opts.page ?? 1), pages);
  const chapters = await db.chapter.findMany({
    where: { novelId, ...published(now) },
    orderBy: { number: opts.order ?? "asc" },
    skip: (page - 1) * perPage,
    take: perPage,
    select: { id: true, number: true, title: true, publishedAt: true, freeAt: true, unlockPrice: true, wordCount: true },
  });
  const unlocked = viewer
    ? new Set(
        (
          await db.chapterUnlock.findMany({
            where: { userId: viewer.id, chapterId: { in: chapters.map((c) => c.id) } },
            select: { chapterId: true },
          })
        ).map((u) => u.chapterId),
      )
    : new Set<number>();
  const items: ChapterListItem[] = chapters.map((c) => ({
    ...c,
    state: chapterState(c, now),
    unlocked: unlocked.has(c.id),
  }));
  return { items, total, page, pages };
}

/** Next releases for one novel (scheduled publishes). */
export async function getUpcomingForNovel(novelId: number) {
  return db.chapter.findMany({
    where: { novelId, publishedAt: { gt: new Date() } },
    orderBy: { publishedAt: "asc" },
    select: { number: true, publishedAt: true },
    take: 3,
  });
}

export async function getReviews(novelId: number, take = 20) {
  return db.review.findMany({
    where: { novelId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, rating: true, body: true, createdAt: true, user: { select: { id: true, username: true, imageUrl: true } } },
  });
}

// ─── Reader ──────────────────────────────────────────────────────────────────

export async function getReaderChapter(slug: string, number: number, viewer: Viewer | null) {
  const now = new Date();
  const chapter = await db.chapter.findFirst({
    where: { number, novel: { slug } },
    select: {
      id: true,
      number: true,
      title: true,
      content: true,
      wordCount: true,
      publishedAt: true,
      freeAt: true,
      unlockPrice: true,
      novelId: true,
      novel: { select: { id: true, slug: true, title: true, author: true, coverUrl: true, coverHue: true } },
    },
  });
  if (!chapter) return null;

  const hasUnlocked = viewer
    ? Boolean(await db.chapterUnlock.findUnique({ where: { userId_chapterId: { userId: viewer.id, chapterId: chapter.id } } }))
    : false;
  const access = chapterAccess(chapter, { isAdmin: viewer?.isAdmin ?? false, hasUnlocked }, now);
  if (access.kind === "unavailable") return null;

  const visible = viewer?.isAdmin ? {} : published(now);
  const [prev, next, balance, progress] = await Promise.all([
    db.chapter.findFirst({ where: { novelId: chapter.novelId, number: { lt: number }, ...visible }, orderBy: { number: "desc" }, select: { number: true } }),
    db.chapter.findFirst({ where: { novelId: chapter.novelId, number: { gt: number }, ...visible }, orderBy: { number: "asc" }, select: { number: true } }),
    viewer ? getBalance(db, viewer.id) : Promise.resolve(null),
    viewer
      ? db.readingProgress.findUnique({ where: { userId_novelId: { userId: viewer.id, novelId: chapter.novelId } } })
      : Promise.resolve(null),
  ]);

  const blocks = asBlocks(chapter.content);
  const readable = access.kind !== "locked";
  // Locked chapters never send more than the preview to the client.
  const body: Block[] = readable ? blocks : previewBlocks(blocks);
  const { content: _content, ...meta } = chapter;
  void _content;

  return {
    chapter: meta,
    body,
    access,
    prev: prev?.number ?? null,
    next: next?.number ?? null,
    balance,
    savedPosition: progress?.chapterId === chapter.id ? progress.position : 0,
  };
}

export async function getComments(chapterId: number) {
  return db.comment.findMany({
    where: { chapterId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, body: true, createdAt: true, user: { select: { id: true, username: true, imageUrl: true } } },
  });
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export async function getSchedule() {
  const now = new Date();
  const [upcoming, goingFree] = await Promise.all([
    db.chapter.findMany({
      where: { publishedAt: { gt: now } },
      orderBy: { publishedAt: "asc" },
      take: 30,
      select: { id: true, number: true, title: true, publishedAt: true, novel: { select: { slug: true, title: true, coverUrl: true, coverHue: true, author: true } } },
    }),
    db.chapter.findMany({
      where: { ...published(now), freeAt: { gt: now } },
      orderBy: { freeAt: "asc" },
      take: 30,
      select: { id: true, number: true, title: true, freeAt: true, unlockPrice: true, novel: { select: { slug: true, title: true, coverUrl: true, coverHue: true, author: true } } },
    }),
  ]);
  return { upcoming, goingFree };
}

// ─── Account ─────────────────────────────────────────────────────────────────

export async function getLibrary(userId: number) {
  const now = new Date();
  const entries = await db.libraryEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, novel: { select: novelCardSelect } },
  });
  const progress = await db.readingProgress.findMany({
    where: { userId },
    select: { novelId: true, position: true, updatedAt: true, chapter: { select: { number: true } } },
  });
  const byNovel = new Map(progress.map((p) => [p.novelId, p]));
  const novels = await withChapterCounts(entries.map((e) => e.novel), now);
  return novels.map((n) => ({ novel: n, progress: byNovel.get(n.id) ?? null }));
}

export async function getCreditsData(userId: number) {
  const [balance, packs, history] = await Promise.all([
    getBalance(db, userId),
    db.creditPack.findMany({ where: { active: true }, orderBy: { credits: "asc" } }),
    db.creditLedgerEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return { balance, packs, history };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAdminOverview() {
  const now = new Date();
  const [novels, chapters, readers, purchases, spent, unlocks, upcoming, recentSales] = await Promise.all([
    db.novel.count(),
    db.chapter.count({ where: published(now) }),
    db.user.count({ where: { clerkId: { not: { startsWith: "seed:" } } } }),
    db.creditLedgerEntry.aggregate({ where: { kind: "PURCHASE" }, _sum: { delta: true }, _count: true }),
    db.creditLedgerEntry.aggregate({ where: { kind: "SPEND" }, _sum: { delta: true } }),
    db.chapterUnlock.count(),
    db.chapter.count({ where: { publishedAt: { gt: now } } }),
    db.creditLedgerEntry.findMany({
      where: { kind: { in: ["PURCHASE", "SPEND"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, delta: true, kind: true, description: true, createdAt: true, user: { select: { username: true } } },
    }),
  ]);
  const novelsList = await db.novel.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      ...novelCardSelect,
      updatedAt: true,
      _count: { select: { chapters: true } },
    },
  });
  return {
    stats: {
      novels,
      chapters,
      readers,
      creditsSold: purchases._sum.delta ?? 0,
      purchases: purchases._count,
      creditsSpent: -(spent._sum.delta ?? 0),
      unlocks,
      upcoming,
    },
    recentSales,
    novels: novelsList,
  };
}

export async function getAdminNovel(slug: string) {
  return db.novel.findUnique({
    where: { slug },
    include: {
      genres: true,
      chapters: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          title: true,
          publishedAt: true,
          freeAt: true,
          unlockPrice: true,
          wordCount: true,
          updatedAt: true,
          _count: { select: { unlocks: true, comments: true } },
        },
      },
    },
  });
}

export async function getAdminChapter(slug: string, number: number) {
  return db.chapter.findFirst({
    where: { number, novel: { slug } },
    include: { novel: { select: { id: true, slug: true, title: true } } },
  });
}

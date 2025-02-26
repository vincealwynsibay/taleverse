import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Db } from "../db";
import { countWords } from "../blocks";
import { slugify } from "../utils";
import { refreshRating } from "../ratings";
import { catalog } from "./catalog";
import { markupToBlocks } from "./markup";
import { buildSchedule } from "./schedule";
import { seedComments, seedReaders, seedReviews, seedViews } from "./social";

type SeedFile = { slug: string; source: string; chapters: { title: string; paragraphs: string[] }[] };

export const DEMO_STARTING_CREDITS = 25;

export const creditPacks = [
  { id: 1, name: "Pocketful", credits: 20, priceCents: 199, highlight: false },
  { id: 2, name: "Bookshelf", credits: 60, priceCents: 499, highlight: true },
  { id: 3, name: "Library", credits: 150, priceCents: 999, highlight: false },
];

type ArtEntry = { label: string; license: string; source: string };
type ArtFile = Record<string, { cover: ArtEntry; banner: ArtEntry }>;

/** Credits for public-domain art in public/covers and public/banners. */
export type ArtCredit = { role: "Cover" | "Banner"; label: string; license: string; url: string };

async function loadArt(): Promise<ArtFile> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "prisma", "seed-data", "art.json"), "utf8"));
  } catch {
    return {};
  }
}

const publicFile = (rel: string) => (existsSync(path.join(process.cwd(), "public", rel)) ? `/${rel}` : null);

async function loadSeedFile(slug: string): Promise<SeedFile> {
  const file = path.join(process.cwd(), "prisma", "seed-data", `${slug}.json`);
  return JSON.parse(await readFile(file, "utf8"));
}


/**
 * Upserts the seed catalog: genres, novels, chapters and their release
 * schedule relative to `now`. Safe to run repeatedly.
 */
export async function seedCatalog(db: Db, { now = new Date(), log = console.log } = {}) {
  const genreNames = [...new Set(catalog.flatMap((b) => b.genres))];
  for (const name of genreNames) {
    await db.genre.upsert({ where: { slug: slugify(name) }, update: { name }, create: { name, slug: slugify(name) } });
  }

  const art = await loadArt();
  for (const book of catalog) {
    const data = await loadSeedFile(book.slug);
    const coverUrl = publicFile(`covers/${book.slug}.jpg`);
    const bannerUrl = publicFile(`banners/${book.slug}.jpg`);
    const a = art[book.slug];
    const credits: ArtCredit[] = a
      ? [
          ...(coverUrl ? [{ role: "Cover" as const, label: a.cover.label, license: a.cover.license, url: a.cover.source }] : []),
          ...(bannerUrl && a.banner.source !== a.cover.source
            ? [{ role: "Banner" as const, label: a.banner.label, license: a.banner.license, url: a.banner.source }]
            : []),
        ]
      : [];
    const fields = {
      title: book.title,
      author: book.author,
      synopsis: book.synopsis,
      releaseYear: book.releaseYear,
      coverHue: book.coverHue,
      status: book.schedule === "complete" ? ("COMPLETED" as const) : ("ONGOING" as const),
      isSeed: true,
      views: seedViews[book.slug] ?? 0,
      coverUrl,
      bannerUrl,
      artCredit: credits.length ? JSON.stringify(credits) : null,
      genres: { set: book.genres.map((g) => ({ slug: slugify(g) })) },
    };
    const novel = await db.novel.upsert({
      where: { slug: book.slug },
      update: fields,
      create: { ...fields, slug: book.slug, genres: { connect: fields.genres.set } },
    });

    const slots = buildSchedule(data.chapters.length, book.schedule, now);
    for (const [i, ch] of data.chapters.entries()) {
      const number = i + 1;
      const content = markupToBlocks(ch.paragraphs);
      const values = {
        title: ch.title,
        content: content as object[],
        wordCount: countWords(content),
        publishedAt: slots[i].publishedAt,
        freeAt: slots[i].freeAt,
        unlockPrice: 5,
      };
      await db.chapter.upsert({
        where: { novelId_number: { novelId: novel.id, number } },
        update: values,
        create: { ...values, novelId: novel.id, number },
      });
    }
    // Chapters an admin added beyond the seed.
    await db.chapter.deleteMany({ where: { novelId: novel.id, number: { gt: data.chapters.length } } });
    log(`  ${book.title}: ${data.chapters.length} chapters`);
  }

  for (const pack of creditPacks) {
    await db.creditPack.upsert({ where: { id: pack.id }, update: pack, create: pack });
  }
}

/** Seed readers, reviews and comments. Replaces previous seeded activity. */
export async function seedCommunity(db: Db) {
  const users = new Map<string, number>();
  for (const r of seedReaders) {
    const u = await db.user.upsert({
      where: { clerkId: `seed:${r.key}` },
      update: { username: r.username },
      create: { clerkId: `seed:${r.key}`, email: `${r.key}@readers.taleverse.local`, username: r.username },
    });
    users.set(r.key, u.id);
  }
  const ids = [...users.values()];
  await db.review.deleteMany({ where: { userId: { in: ids } } });
  await db.comment.deleteMany({ where: { userId: { in: ids } } });

  const novels = await db.novel.findMany({ where: { isSeed: true }, select: { id: true, slug: true } });
  for (const novel of novels) {
    for (const r of seedReviews[novel.slug] ?? []) {
      await db.review.create({ data: { userId: users.get(r.by)!, novelId: novel.id, rating: r.rating, body: r.body } });
    }
    for (const c of seedComments[novel.slug] ?? []) {
      const chapter = await db.chapter.findUnique({ where: { novelId_number: { novelId: novel.id, number: c.chapter } } });
      if (chapter) await db.comment.create({ data: { userId: users.get(c.by)!, chapterId: chapter.id, body: c.body } });
    }
    await refreshRating(db, novel.id);
  }
}

/**
 * Restores the demo: catalog back to seed state (and fresh dates), non-seed
 * novels removed, demo accounts' activity wiped and their credits refilled.
 * Real users' activity on seed chapters is kept.
 */
export async function resetDemo(db: Db, { now = new Date(), log = console.log } = {}) {
  await db.novel.deleteMany({ where: { isSeed: false } });
  await seedCatalog(db, { now, log });
  await seedCommunity(db);

  const demoUsers = await db.user.findMany({ where: { isDemo: true } });
  for (const user of demoUsers) {
    await db.creditLedgerEntry.deleteMany({ where: { userId: user.id } });
    await db.libraryEntry.deleteMany({ where: { userId: user.id } });
    await db.readingProgress.deleteMany({ where: { userId: user.id } });
    await db.review.deleteMany({ where: { userId: user.id } });
    await db.comment.deleteMany({ where: { userId: user.id } });
    await prepareDemoUser(db, user.id, now);
  }
  // Ratings may have changed after removing demo reviews.
  for (const n of await db.novel.findMany({ select: { id: true } })) await refreshRating(db, n.id);
  log(`  reset ${demoUsers.length} demo account(s)`);
}

/** Starting state for a demo account: credits, a small library, one book in progress. */
export async function prepareDemoUser(db: Db, userId: number, now = new Date()) {
  await db.creditLedgerEntry.create({
    data: {
      userId,
      delta: DEMO_STARTING_CREDITS,
      kind: "GRANT",
      idempotencyKey: `demo:${userId}:${now.getTime()}`,
      description: "Demo credits",
    },
  });
  const library = await db.novel.findMany({ where: { slug: { in: ["dracula", "treasure-island"] } } });
  for (const novel of library) {
    await db.libraryEntry.upsert({
      where: { userId_novelId: { userId, novelId: novel.id } },
      update: {},
      create: { userId, novelId: novel.id },
    });
  }
  const dracula = library.find((n) => n.slug === "dracula");
  if (dracula) {
    const chapter = await db.chapter.findUnique({ where: { novelId_number: { novelId: dracula.id, number: 3 } } });
    if (chapter) {
      await db.readingProgress.upsert({
        where: { userId_novelId: { userId, novelId: dracula.id } },
        update: { chapterId: chapter.id, position: 0.4 },
        create: { userId, novelId: dracula.id, chapterId: chapter.id, position: 0.4 },
      });
    }
  }
}

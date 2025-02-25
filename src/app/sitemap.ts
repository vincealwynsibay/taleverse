import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Novels, genres and every chapter that is free to read (early-access chapters are noindex). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [novels, genres, chapters] = await Promise.all([
    db.novel.findMany({ select: { slug: true, updatedAt: true } }),
    db.genre.findMany({ select: { slug: true } }),
    db.chapter.findMany({
      where: { publishedAt: { lte: now }, OR: [{ freeAt: null }, { freeAt: { lte: now } }] },
      select: { number: true, updatedAt: true, novel: { select: { slug: true } } },
    }),
  ]);
  const url = (path: string) => new URL(path, env.appUrl).toString();
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/novels"), changeFrequency: "daily", priority: 0.8 },
    { url: url("/schedule"), changeFrequency: "hourly", priority: 0.6 },
    ...genres.map((g) => ({ url: url(`/genres/${g.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...novels.map((n) => ({ url: url(`/novels/${n.slug}`), lastModified: n.updatedAt, changeFrequency: "daily" as const, priority: 0.9 })),
    ...chapters.map((c) => ({ url: url(`/novels/${c.novel.slug}/${c.number}`), lastModified: c.updatedAt, priority: 0.4 })),
  ];
}

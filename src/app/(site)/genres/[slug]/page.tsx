import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BrowseView } from "@/components/novel/BrowseView";

export async function generateMetadata({ params }: PageProps<"/genres/[slug]">): Promise<Metadata> {
  const genre = await db.genre.findUnique({ where: { slug: (await params).slug } });
  return genre ? { title: `${genre.name} novels`, description: `Serialized ${genre.name.toLowerCase()} fiction on Taleverse.` } : {};
}

export default async function GenrePage({ params, searchParams }: PageProps<"/genres/[slug]">) {
  const { slug } = await params;
  const genre = await db.genre.findUnique({ where: { slug } });
  if (!genre) notFound();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return (
    <BrowseView
      basePath={`/genres/${slug}`}
      title={genre.name}
      params={{ genre: slug, status: one(sp.status), sort: one(sp.sort) }}
    />
  );
}

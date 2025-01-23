import ChapterReader from "@/components/ChapterReader";
import {
  getNovelChapterBySlug,
  getNovelPublishedChapters,
} from "@/lib/actions/chapter.action";
import React from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ chapter: string; slug: string }>;
}) {
  const p = await params;
  const chapter = await getNovelChapterBySlug(p.chapter);

  if (!chapter.data) return null;

  const chapters = await getNovelPublishedChapters(chapter.data.novelId);

  if (!chapters.data) return null;

  return (
    <div>
      <ChapterReader chapters={chapters.data} chapter={chapter.data} />
    </div>
  );
}

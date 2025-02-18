import ChapterReader from "@/components/ChapterReader";
import {
  getNovelChapterBySlug,
  getNovelPublishedChapters,
} from "@/lib/actions/chapter.action";
import { isAuthorized } from "@/lib/actions/stripe.action";
import { auth } from "@clerk/nextjs/server";
import React from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ chapter: string; slug: string }>;
}) {
  const p = await params;
  const { userId } = await auth();

  if (!userId) return null;

  if (!isAuthorized(userId, p.slug)) {
    return (
      <div>
        <h1>Unauthorized</h1>
        <p>You are not authorized to view this page</p>
      </div>
    );
  }

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

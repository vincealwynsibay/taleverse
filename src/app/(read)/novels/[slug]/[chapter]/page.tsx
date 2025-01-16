import ChapterView from "@/components/ChapterView";
import ChapterNavbar from "@/components/ChapterNavbar";
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

  // const html = await editor.withReactContext(
  //   ({ children }: {children: React}) => <div>{children}</div>,
  //   async () => editor.blocksToFullHTML(blocks)
  // );
  return (
    <div>
      <ChapterNavbar chapters={chapters.data} chapter={chapter.data} />
      <ChapterView chapter={chapter.data} />
    </div>
  );
}

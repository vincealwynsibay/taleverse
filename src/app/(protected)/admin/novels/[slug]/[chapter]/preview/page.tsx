import ChapterView from "@/components/ChapterView";
import {
  getNovelChapter,
  getNovelChapterBySlug,
} from "@/lib/actions/chapter.action";

export default async function Page({
  params,
}: {
  params: Promise<{
    chapter: string;
    slug: string;
  }>;
}) {
  const p = await params;
  const chapter = await getNovelChapterBySlug(p.chapter);

  if (!chapter.data) return null;

  return <ChapterView chapter={chapter.data} />;
}

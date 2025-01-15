import ChapterView from "@/components/ChapterView";
import { getNovelChapterBySlug } from "@/lib/actions/chapter.action";

export default async function Page({
  params,
}: {
  params: Promise<{ chapter: string; slug: string }>;
}) {
  const p = await params;
  const chapter = await getNovelChapterBySlug(p.chapter);

  console.log(chapter);
  if (!chapter.data) return null;

  return (
    <div>
      <ChapterView chapter={chapter.data} />
    </div>
  );
}

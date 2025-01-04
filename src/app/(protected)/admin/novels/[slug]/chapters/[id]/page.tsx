import WriteChapterForm from "@/components/WriteChapterForm";
import { getNovelChapter } from "@/lib/actions/chapter.action";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const p = await params;
  const chapterId = parseInt(p.id);
  const chapter = await getNovelChapter(chapterId);

  if (!chapter.data) return null;

  return (
    <div>
      <WriteChapterForm slug={p.slug} chapter={chapter.data} />
    </div>
  );
}

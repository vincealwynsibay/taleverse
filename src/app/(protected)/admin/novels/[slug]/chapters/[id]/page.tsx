import ChapterEditor from "@/components/ChapterEditor";
import { getNovelChapter } from "@/lib/actions/chapter.action";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const chapterId = parseInt((await params).id);
  const chapter = await getNovelChapter(chapterId);
  console.log(chapter);

  if (!chapter.data) return null;

  return (
    <div>
      <ChapterEditor chapterId={chapterId} content={chapter.data.content} />
    </div>
  );
}

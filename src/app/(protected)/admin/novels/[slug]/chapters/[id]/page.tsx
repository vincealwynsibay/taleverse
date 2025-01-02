import Editor from "@/components/Editor";
import { getNovelChapter } from "@/lib/actions/chapter.action";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const chapterId = parseInt((await params).id);
  const chapter = await getNovelChapter(chapterId);
  console.log(chapter);
  return (
    <div>
      <Editor />
    </div>
  );
}

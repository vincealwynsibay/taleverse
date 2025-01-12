import ChapterList from "@/components/ChapterList";
import NovelView from "@/components/NovelView";
import { getNovel } from "@/lib/actions/novel.action";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const novel = await getNovel((await params).slug);

  if (!novel.data) return null;

  console.log(novel.data.chapter);
  const chapters = novel.data.chapter;
  return (
    <div>
      <NovelView novel={novel.data} />

      <ChapterList slug={novel.data.slug} chapters={chapters} />
    </div>
  );
}

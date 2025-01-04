import NovelView from "@/components/NovelView";
import { getNovel } from "@/lib/actions/novel.action";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const novel = await getNovel((await params).slug);

  if (!novel.data) return null;

  return (
    <div>
      <NovelView novel={novel.data} />
    </div>
  );
}

import ChapterList from "@/components/ChapterList";
import NovelView from "@/components/NovelView";
// import { getNovelPublishedChapters } from "@/lib/actions/chapter.action";
import { getNovelBySlug } from "@/lib/actions/novel.action";
import { auth } from "@clerk/nextjs/server";

// force-dynamic
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const novel = await getNovelBySlug((await params).slug);

  const { userId: clerkId } = await auth();
  console.log("novel", novel);
  if (!novel.data) return null;

  // const chapters = await getNovelPublishedChapters(novel.data.id);

  // if (!chapters.data) return null;

  return (
    <div>
      <NovelView novel={novel.data} />
      <ChapterList
        clerkId={clerkId}
        slug={novel.data.slug}
        novel={novel.data}
      />
    </div>
  );
}

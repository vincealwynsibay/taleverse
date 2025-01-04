import ChapterEditor from "@/components/ChapterEditor";
import { Button } from "@/components/ui/button";
import { getNovelChapter } from "@/lib/actions/chapter.action";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  console.log(await params);
  const p = await params;
  const chapterId = parseInt(p.id);
  const chapter = await getNovelChapter(chapterId);
  console.log(chapter);

  if (!chapter.data) return null;

  return (
    <div>
      <div className="flex gap-2">
        {/* // redirectS to another route */}
        {!chapter.data.published && (
          <Button asChild>
            <Link
              href={`/admin/novels/${p.slug}/chapters/${chapterId}/preview`}
            >
              Preview
            </Link>
          </Button>
        )}
      </div>

      <ChapterEditor chapterId={chapterId} content={chapter.data.content} />
    </div>
  );
}

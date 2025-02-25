import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye } from "lucide-react";
import { asBlocks } from "@/lib/blocks";
import { getAdminChapter } from "@/lib/queries";
import { readingMinutes } from "@/lib/utils";
import { ChapterWorkbench } from "@/components/admin/ChapterWorkbench";
import { DeleteChapterButton } from "@/components/admin/ChapterActions";
import { SchedulePanel } from "@/components/admin/SchedulePanel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditChapterPage({ params }: PageProps<"/admin/novels/[slug]/chapters/[number]">) {
  const { slug, number } = await params;
  const chapter = await getAdminChapter(slug, Number(number));
  if (!chapter) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/novels/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> {chapter.novel.title}
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href={`/novels/${slug}/${chapter.number}`}>
            <Eye /> Preview as reader
          </Link>
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <ChapterWorkbench
          key={chapter.id}
          chapterId={chapter.id}
          number={chapter.number}
          initialTitle={chapter.title}
          initialContent={asBlocks(chapter.content)}
          updatedAt={chapter.updatedAt.toISOString()}
        />
        <aside className="space-y-4 lg:sticky lg:top-20">
          <SchedulePanel chapterId={chapter.id} publishedAt={chapter.publishedAt} freeAt={chapter.freeAt} unlockPrice={chapter.unlockPrice} />
          <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground tabular-nums">{chapter.wordCount.toLocaleString()}</span> words ·{" "}
              {readingMinutes(chapter.wordCount)} min read
            </p>
            <p className="mt-1 text-xs">Autosaves as you type. ⌘S / Ctrl+S saves now.</p>
          </div>
          <DeleteChapterButton chapterId={chapter.id} label={`Chapter ${chapter.number}`} />
        </aside>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, ExternalLink, LockKeyhole, MessageCircle } from "lucide-react";
import { chapterState } from "@/lib/access";
import { getAdminNovel, getGenres } from "@/lib/queries";
import { ChapterBadge } from "@/components/novel/ChapterBadge";
import { NovelForm } from "@/components/admin/NovelForm";
import { DeleteNovelButton, NewChapterButton } from "@/components/admin/ChapterActions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminNovelPage({ params }: PageProps<"/admin/novels/[slug]">) {
  const { slug } = await params;
  const [novel, genres] = await Promise.all([getAdminNovel(slug), getGenres()]);
  if (!novel) notFound();
  const now = new Date();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" /> Overview
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{novel.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/novels/${novel.slug}`}>
              View page <ExternalLink />
            </Link>
          </Button>
          <NewChapterButton novelId={novel.id} />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Chapters</h2>
          <p className="text-xs text-muted-foreground">{novel.chapters.length} total</p>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="w-14 px-4 py-2 text-right font-medium">#</th>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">State</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">Release</th>
              <th className="hidden px-4 py-2 font-medium lg:table-cell">Free from</th>
              <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...novel.chapters].reverse().map((c) => {
              const state = chapterState(c, now);
              return (
                <tr key={c.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2 text-right text-muted-foreground tabular-nums">{c.number}</td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/novels/${slug}/chapters/${c.number}`} className="font-medium hover:text-primary">
                      {c.title || <span className="text-muted-foreground italic">Untitled</span>}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">{c.wordCount.toLocaleString()} words</span>
                  </td>
                  <td className="px-4 py-2">
                    {state === "free" ? <span className="text-xs font-medium text-success">Free</span> : <ChapterBadge state={state} />}
                  </td>
                  <td className="hidden px-4 py-2 text-muted-foreground tabular-nums md:table-cell">
                    {c.publishedAt ? format(c.publishedAt, "MMM d, yyyy h:mm a") : "–"}
                  </td>
                  <td className="hidden px-4 py-2 text-muted-foreground tabular-nums lg:table-cell">
                    {c.freeAt ? format(c.freeAt, "MMM d, yyyy") : "–"}
                  </td>
                  <td className="hidden px-4 py-2 text-right text-xs text-muted-foreground tabular-nums sm:table-cell">
                    <span className="inline-flex items-center gap-3">
                      <span className="inline-flex items-center gap-1" title="Unlocks">
                        <LockKeyhole className="size-3" /> {c._count.unlocks}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Comments">
                        <MessageCircle className="size-3" /> {c._count.comments}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {novel.chapters.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No chapters yet. Create the first one.</p>}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Details</h2>
          <DeleteNovelButton novelId={novel.id} title={novel.title} />
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <NovelForm novel={novel} genres={genres} />
        </div>
      </section>
    </div>
  );
}

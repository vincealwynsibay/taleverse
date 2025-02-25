import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { getViewer } from "@/lib/auth";
import { getLibrary } from "@/lib/queries";
import { NovelCover } from "@/components/NovelCover";
import { EmptyState } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Your library" };

export default async function LibraryPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?redirect_url=/library");
  const shelf = await getLibrary(viewer.id);

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Your library</h1>
        <p className="mt-2 text-muted-foreground">Novels you&apos;re following, and where you left off.</p>
      </header>

      {shelf.length === 0 ? (
        <EmptyState title="Your shelf is empty">
          Add novels from their page and they&apos;ll show up here with your progress.
          <div className="mt-4">
            <Button asChild>
              <Link href="/novels">Browse novels</Link>
            </Button>
          </div>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shelf.map(({ novel, progress }) => {
            const current = progress?.chapter.number ?? 0;
            const pct = novel.chapterCount ? ((Math.max(0, current - 1) + (progress?.position ?? 0)) / novel.chapterCount) * 100 : 0;
            return (
              <li key={novel.id} className="flex gap-4 rounded-2xl border bg-card p-4">
                <Link href={`/novels/${novel.slug}`} className="shrink-0">
                  <NovelCover title={novel.title} author={novel.author} coverUrl={novel.coverUrl} hue={novel.coverHue} size="sm" className="w-20" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/novels/${novel.slug}`} className="line-clamp-2 font-display leading-snug font-semibold hover:text-primary">
                    {novel.title}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">{novel.author}</p>
                  <div className="mt-auto space-y-2 pt-3">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-1.5" />
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{Math.round(pct)}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {progress
                          ? `Ch. ${current} of ${novel.chapterCount} · ${formatDistanceToNowStrict(progress.updatedAt, { addSuffix: true })}`
                          : "Not started"}
                      </span>
                      <Button asChild size="sm" variant={progress ? "default" : "outline"}>
                        <Link href={`/novels/${novel.slug}/${current || 1}`}>{progress ? "Continue" : "Start"}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

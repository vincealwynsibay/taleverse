import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { format } from "date-fns";
import { ChevronRight, LockKeyhole, PencilLine } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { chapterState } from "@/lib/access";
import { blockText } from "@/lib/blocks";
import { db } from "@/lib/db";
import { getChapterList, getComments, getReaderChapter } from "@/lib/queries";
import { parseReaderSettings, READER_COOKIE } from "@/lib/reader-settings";
import { readingMinutes } from "@/lib/utils";
import { ChapterBody } from "@/components/reader/ChapterBody";
import { Comments } from "@/components/reader/Comments";
import { Paywall } from "@/components/reader/Paywall";
import { ReaderShell } from "@/components/reader/ReaderShell";

async function load(params: PageProps<"/novels/[slug]/[chapter]">["params"]) {
  const { slug, chapter } = await params;
  const number = Number(chapter);
  if (!Number.isInteger(number) || number < 1) notFound();
  const viewer = await getViewer();
  const data = await getReaderChapter(slug, number, viewer);
  if (!data) notFound();
  return { slug, number, viewer, data };
}

export async function generateMetadata({ params }: PageProps<"/novels/[slug]/[chapter]">): Promise<Metadata> {
  const { data } = await load(params);
  const label = data.chapter.title ? `Chapter ${data.chapter.number}: ${data.chapter.title}` : `Chapter ${data.chapter.number}`;
  return {
    title: `${label} · ${data.chapter.novel.title}`,
    description: data.body.map(blockText).join(" ").slice(0, 160),
    // Early-access chapters shouldn't be indexed with a paywall; they're indexed once free.
    robots: data.access.kind === "free" ? undefined : { index: false },
  };
}

export default async function ReaderPage({ params, searchParams }: PageProps<"/novels/[slug]/[chapter]">) {
  const { slug, number, viewer, data } = await load(params);
  const startAtEnd = (await searchParams).at === "end";
  const { chapter, body, access } = data;
  const [settingsCookie, toc, comments, libraryEntry] = await Promise.all([
    cookies().then((c) => c.get(READER_COOKIE)?.value),
    getChapterList(chapter.novelId, viewer, { perPage: 1000 }),
    getComments(chapter.id),
    viewer ? db.libraryEntry.findUnique({ where: { userId_novelId: { userId: viewer.id, novelId: chapter.novelId } } }) : null,
  ]);
  const nextItem = data.next ? toc.items.find((c) => c.number === data.next) : undefined;
  const locked = access.kind === "locked";
  const state = chapterState(chapter);

  // Count a read without delaying the response.
  if (!viewer?.isAdmin) {
    // Raw SQL so a view doesn't touch updatedAt (which drives "Recently updated").
    after(() => db.$executeRaw`UPDATE "Novel" SET views = views + 1 WHERE id = ${chapter.novelId}`);
  }

  return (
    <ReaderShell
      novel={{ id: chapter.novelId, slug, title: chapter.novel.title }}
      chapter={{ id: chapter.id, number, title: chapter.title, wordCount: chapter.wordCount }}
      prev={data.prev}
      next={data.next}
      toc={toc.items.map((c) => ({ number: c.number, title: c.title, locked: c.state === "early-access" && !c.unlocked }))}
      initialSettings={parseReaderSettings(settingsCookie)}
      signedIn={Boolean(viewer)}
      inLibrary={Boolean(libraryEntry)}
      trackProgress={!locked}
      savedPosition={data.savedPosition}
      startAtEnd={startAtEnd}
      footer={
        !locked && (
          <>
            <div className="mx-auto max-w-[var(--reader-width)] px-5 pb-10 font-sans">
              {nextItem ? (
                <Link
                  href={`/novels/${slug}/${nextItem.number}`}
                  className="group flex items-center gap-4 rounded-lg border border-current/15 p-4 transition-colors hover:border-primary"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs opacity-60">Up next</p>
                    <p className="truncate font-medium group-hover:text-primary">
                      Chapter {nextItem.number}
                      {nextItem.title && `: ${nextItem.title}`}
                    </p>
                    {nextItem.state === "early-access" && !nextItem.unlocked && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-primary">
                        <LockKeyhole className="size-3" /> Early access · {nextItem.unlockPrice} credits
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-5 opacity-60 group-hover:text-primary group-hover:opacity-100" />
                </Link>
              ) : (
                <p className="rounded-lg border border-dashed border-current/15 p-4 text-center text-sm opacity-70">
                  You&apos;re all caught up.{" "}
                  <Link href="/schedule" className="underline underline-offset-2">
                    See when the next chapter drops
                  </Link>
                  .
                </p>
              )}
            </div>
            <Comments chapterId={chapter.id} comments={comments} viewer={viewer && { id: viewer.id, isAdmin: viewer.isAdmin }} />
          </>
        )
      }
    >
      <article className="mx-auto max-w-[var(--reader-width)] px-5 pt-12 pb-10 sm:pt-16">
        {access.kind === "staff" && state !== "free" && (
          <p className="mb-6 rounded-lg border border-dashed border-current/20 px-3 py-2 font-sans text-xs opacity-70">
            Admin preview · this chapter is <strong>{state.replace("-", " ")}</strong>
            {chapter.publishedAt && state === "scheduled" && <> and releases {format(chapter.publishedAt, "MMM d 'at' h:mm a")}</>}
          </p>
        )}
        <header className="mb-10 text-center font-sans">
          <p className="text-sm opacity-60">Chapter {number}</p>
          {chapter.title && (
            <h1 className="mt-3 text-2xl leading-tight font-semibold text-balance sm:text-3xl">{chapter.title}</h1>
          )}
          <p className="mt-4 text-xs opacity-50">
            {chapter.publishedAt && format(chapter.publishedAt, "MMMM d, yyyy")} · {readingMinutes(chapter.wordCount)} min read
            {viewer?.isAdmin && (
              <>
                {" · "}
                <Link href={`/admin/novels/${slug}/chapters/${number}`} className="inline-flex items-center gap-1 underline underline-offset-2">
                  <PencilLine className="size-3" /> Edit
                </Link>
              </>
            )}
          </p>
        </header>

        <div
          id="chapter-body"
          className="prose-reader text-[length:var(--reader-size)] leading-[var(--reader-leading)]"
          style={locked ? { maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)" } : undefined}
        >
          <ChapterBody blocks={body} />
        </div>

        {locked && (
          <Paywall
            chapterId={chapter.id}
            price={access.price}
            freeAt={access.freeAt.toISOString()}
            balance={data.balance}
            returnTo={`/novels/${slug}/${number}`}
          />
        )}

      </article>
    </ReaderShell>
  );
}

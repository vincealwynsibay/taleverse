import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { format } from "date-fns";
import { PencilLine } from "lucide-react";
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

export default async function ReaderPage({ params }: PageProps<"/novels/[slug]/[chapter]">) {
  const { slug, number, viewer, data } = await load(params);
  const { chapter, body, access } = data;
  const [settingsCookie, toc, comments] = await Promise.all([
    cookies().then((c) => c.get(READER_COOKIE)?.value),
    getChapterList(chapter.novelId, viewer, { perPage: 1000 }),
    getComments(chapter.id),
  ]);
  const locked = access.kind === "locked";
  const state = chapterState(chapter);

  // Count a read without delaying the response.
  if (!viewer?.isAdmin) {
    // Raw SQL so a view doesn't touch updatedAt (which drives "Recently updated").
    after(() => db.$executeRaw`UPDATE "Novel" SET views = views + 1 WHERE id = ${chapter.novelId}`);
  }

  return (
    <ReaderShell
      novel={{ slug, title: chapter.novel.title }}
      chapter={{ id: chapter.id, number, title: chapter.title }}
      prev={data.prev}
      next={data.next}
      toc={toc.items.map((c) => ({ number: c.number, title: c.title, locked: c.state === "early-access" && !c.unlocked }))}
      initialSettings={parseReaderSettings(settingsCookie)}
      signedIn={Boolean(viewer)}
      trackProgress={!locked}
      savedPosition={data.savedPosition}
      footer={
        !locked && <Comments chapterId={chapter.id} comments={comments} viewer={viewer && { id: viewer.id, isAdmin: viewer.isAdmin }} />
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
          <p className="font-mono text-xs font-semibold tracking-[0.25em] uppercase opacity-55">Chapter {number}</p>
          {chapter.title && (
            <h1 className="mt-3 font-display text-3xl leading-tight font-semibold text-balance sm:text-4xl">{chapter.title}</h1>
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

        {!locked && !data.next && (
          <p className="mt-16 text-center font-sans text-sm opacity-60">You&apos;re all caught up. ⁂</p>
        )}
      </article>
    </ReaderShell>
  );
}

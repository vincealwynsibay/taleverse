import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowDownUp, BookOpenText, CalendarClock, ChevronLeft, ChevronRight, Clock, Eye, LockKeyhole, MessageSquareText } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getChapterList, getNovel, getNovelViewerState, getReviews, getUpcomingForNovel } from "@/lib/queries";
import { cn, formatCompact } from "@/lib/utils";
import { NovelCover } from "@/components/NovelCover";
import { RatingStars } from "@/components/RatingStars";
import { StatusPill } from "@/components/novel/NovelCard";
import { ChapterBadge } from "@/components/novel/ChapterBadge";
import { LibraryButton } from "@/components/novel/LibraryButton";
import { ReviewForm, ReviewList, SignInToReview } from "@/components/novel/Reviews";
import { EmptyState } from "@/components/Section";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/novels/[slug]">): Promise<Metadata> {
  const novel = await getNovel((await params).slug);
  if (!novel) return {};
  return {
    title: `${novel.title} by ${novel.author}`,
    description: novel.synopsis.slice(0, 160),
    openGraph: { title: novel.title, description: novel.synopsis.slice(0, 200), type: "book" },
  };
}

const PER_PAGE = 50;

export default async function NovelPage({ params, searchParams }: PageProps<"/novels/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const novel = await getNovel(slug);
  if (!novel) notFound();

  const viewer = await getViewer();
  const order = sp.order === "desc" ? "desc" : "asc";
  const requestedPage = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const [state, list, reviews, upcoming] = await Promise.all([
    getNovelViewerState(novel.id, viewer),
    getChapterList(novel.id, viewer, { page: requestedPage, perPage: PER_PAGE, order }),
    getReviews(novel.id),
    getUpcomingForNovel(novel.id),
  ]);

  const resume = state.progress?.chapter.number;
  const startHref = resume ? `/novels/${slug}/${resume}` : state.firstChapter ? `/novels/${slug}/${state.firstChapter}` : null;
  const listHref = (patch: { page?: number; order?: string }) => {
    const qs = new URLSearchParams();
    const o = patch.order ?? order;
    const p = patch.page ?? list.page;
    if (o !== "asc") qs.set("order", o);
    if (p > 1) qs.set("page", String(p));
    return `/novels/${slug}${qs.size ? `?${qs}` : ""}#chapters`;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: novel.title,
    author: { "@type": "Person", name: novel.author },
    description: novel.synopsis,
    genre: novel.genres.map((g) => g.name),
    ...(novel.ratingCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: novel.ratingAvg.toFixed(1), reviewCount: novel.ratingCount },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* ── Header ── */}
      <section className="relative isolate overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-35 dark:opacity-25"
          style={{ background: `radial-gradient(70% 90% at 20% 0%, oklch(0.6 0.12 ${novel.coverHue}), transparent 70%)` }}
        />
        <div className="container-page grid gap-8 py-10 md:grid-cols-[220px_1fr] md:py-14">
          <NovelCover title={novel.title} author={novel.author} coverUrl={novel.coverUrl} hue={novel.coverHue} size="lg" priority className="mx-auto w-44 md:w-full" />
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={novel.status} />
              {novel.genres.map((g) => (
                <Link key={g.slug} href={`/genres/${g.slug}`} className="rounded-full border bg-background/60 px-2.5 py-0.5 text-xs hover:border-primary/50 hover:text-primary">
                  {g.name}
                </Link>
              ))}
            </div>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">{novel.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {novel.author}
              {novel.releaseYear && <span className="text-muted-foreground/70"> · first published {novel.releaseYear}</span>}
            </p>

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="sr-only">Rating</dt>
                <dd className="flex items-center gap-2">
                  <RatingStars value={novel.ratingAvg} size={16} />
                  <span className="font-semibold tabular-nums">{novel.ratingCount ? novel.ratingAvg.toFixed(1) : "–"}</span>
                  <a href="#reviews" className="text-muted-foreground hover:text-foreground">
                    ({novel.ratingCount} {novel.ratingCount === 1 ? "review" : "reviews"})
                  </a>
                </dd>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpenText className="size-4" aria-hidden /> <dd className="tabular-nums">{state.chapterCount} chapters</dd>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" aria-hidden />
                <dd className="tabular-nums">{Math.max(1, Math.round(state.wordCount / 230 / 60))} hours of reading</dd>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="size-4" aria-hidden /> <dd className="tabular-nums">{formatCompact(novel.views)} reads</dd>
              </div>
            </dl>

            <p className="mt-6 max-w-2xl leading-relaxed text-pretty text-foreground/85">{novel.synopsis}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {startHref && (
                <Button asChild size="lg">
                  <Link href={startHref}>{resume ? `Continue · Chapter ${resume}` : "Start reading"}</Link>
                </Button>
              )}
              {state.latestChapter && state.latestChapter !== resume && (
                <Button asChild size="lg" variant="secondary">
                  <Link href={`/novels/${slug}/${state.latestChapter}`}>Latest chapter</Link>
                </Button>
              )}
              <LibraryButton novelId={novel.id} inLibrary={state.inLibrary} signedIn={Boolean(viewer)} />
            </div>

            {upcoming.length > 0 && (
              <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="size-4 text-primary" aria-hidden />
                Chapter {upcoming[0].number} releases{" "}
                <time dateTime={upcoming[0].publishedAt!.toISOString()} className="font-medium text-foreground">
                  {formatDistanceToNowStrict(upcoming[0].publishedAt!, { addSuffix: true })}
                </time>
                {upcoming.length > 1 && <span>· {upcoming.length - 1} more scheduled</span>}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="container-page grid gap-14 py-12 lg:grid-cols-[1fr_340px]">
        {/* ── Chapters ── */}
        <section id="chapters" className="scroll-mt-24">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">Chapters</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={listHref({ order: order === "asc" ? "desc" : "asc", page: 1 })}>
                <ArrowDownUp /> {order === "asc" ? "Oldest first" : "Newest first"}
              </Link>
            </Button>
          </div>
          {list.items.length ? (
            <ol className="divide-y rounded-2xl border bg-card">
              {list.items.map((c) => (
                <li key={c.id}>
                  <Link href={`/novels/${slug}/${c.number}`} className="group flex items-center gap-4 px-4 py-3 hover:bg-accent/50">
                    <span className="w-8 shrink-0 text-right font-display text-lg text-muted-foreground tabular-nums">{c.number}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">{c.title || `Chapter ${c.number}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.publishedAt && format(c.publishedAt, "MMM d, yyyy")} · {Math.max(1, Math.round(c.wordCount / 230))} min
                        {c.state === "early-access" && !c.unlocked && c.freeAt && (
                          <> · free {formatDistanceToNowStrict(c.freeAt, { addSuffix: true })}</>
                        )}
                      </p>
                    </div>
                    {c.state === "early-access" && !c.unlocked && (
                      <span className="hidden items-center gap-1 text-xs font-medium text-primary tabular-nums sm:flex">
                        <LockKeyhole className="size-3" /> {c.unlockPrice}
                      </span>
                    )}
                    <ChapterBadge state={c.state} unlocked={c.unlocked} />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No chapters yet">The first chapter hasn&apos;t been released. Check the schedule.</EmptyState>
          )}
          {list.pages > 1 && (
            <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Chapter pages">
              <Button asChild variant="outline" size="sm" className={cn(list.page === 1 && "pointer-events-none opacity-50")}>
                <Link href={listHref({ page: list.page - 1 })} aria-disabled={list.page === 1}>
                  <ChevronLeft /> Previous
                </Link>
              </Button>
              <span className="text-muted-foreground tabular-nums">
                Page {list.page} of {list.pages}
              </span>
              <Button asChild variant="outline" size="sm" className={cn(list.page === list.pages && "pointer-events-none opacity-50")}>
                <Link href={listHref({ page: list.page + 1 })} aria-disabled={list.page === list.pages}>
                  Next <ChevronRight />
                </Link>
              </Button>
            </nav>
          )}
        </section>

        {/* ── Reviews ── */}
        <section id="reviews" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-5 text-primary" aria-hidden />
            <h2 className="font-display text-2xl font-semibold">Reviews</h2>
          </div>
          {viewer ? (
            <ReviewForm novelId={novel.id} existing={state.myReview && { rating: state.myReview.rating, body: state.myReview.body }} />
          ) : (
            <SignInToReview />
          )}
          {reviews.length ? (
            <ReviewList reviews={reviews} viewerId={viewer?.id ?? null} />
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first.</p>
          )}
        </section>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowDown, ArrowUp, CalendarClock, Check, ChevronLeft, ChevronRight, LockKeyhole, Star } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getChapterList, getNovel, getNovelViewerState, getReviews, getSimilarNovels, getUpcomingForNovel } from "@/lib/queries";
import { cn, formatCompact } from "@/lib/utils";
import { NovelCover } from "@/components/NovelCover";
import { LibraryButton } from "@/components/novel/LibraryButton";
import { ReviewForm, ReviewList, SignInToReview } from "@/components/novel/Reviews";
import { EmptyState, Section } from "@/components/Section";
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
  const order = sp.order === "asc" ? "asc" : "desc"; // newest first, like most web-novel sites
  const requestedPage = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const [state, list, reviews, upcoming, similar] = await Promise.all([
    getNovelViewerState(novel.id, viewer),
    getChapterList(novel.id, viewer, { page: requestedPage, perPage: PER_PAGE, order }),
    getReviews(novel.id),
    getUpcomingForNovel(novel.id),
    getSimilarNovels(novel.id, novel.genres.map((g) => g.slug)),
  ]);

  const resume = state.progress?.chapter.number;
  const startNumber = resume ?? state.firstChapter;
  const listHref = (patch: { page?: number; order?: string }) => {
    const qs = new URLSearchParams();
    const o = patch.order ?? order;
    const p = patch.page ?? list.page;
    if (o !== "desc") qs.set("order", o);
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
    <div className="container-page py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Link href="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Home
      </Link>

      {/* ── Banner hero ── */}
      <section className="relative overflow-hidden rounded-lg border">
        <div aria-hidden className="absolute inset-0">
          {novel.coverUrl ? (
            <Image src={novel.coverUrl} alt="" fill sizes="100vw" className="scale-110 object-cover opacity-60 blur-2xl" />
          ) : (
            <div className="h-full w-full" style={{ background: `linear-gradient(120deg, oklch(0.42 0.09 ${novel.coverHue}), oklch(0.22 0.04 ${novel.coverHue}))` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        </div>
        <div className="relative grid gap-6 p-5 pt-24 sm:grid-cols-[160px_1fr] sm:p-6 sm:pt-28">
          <NovelCover title={novel.title} author={novel.author} coverUrl={novel.coverUrl} hue={novel.coverHue} size="lg" priority className="w-36 shadow-2xl sm:w-full" />
          <div className="flex min-w-0 flex-col justify-end">
            <div className="flex flex-wrap gap-1.5 text-[0.65rem] font-medium tracking-wide uppercase">
              {novel.genres.slice(0, 1).map((g) => (
                <span key={g.slug} className="rounded-sm bg-primary/20 px-1.5 py-0.5 text-primary">
                  {g.name}
                </span>
              ))}
              {novel.releaseYear && <span className="rounded-sm bg-foreground/10 px-1.5 py-0.5">{novel.releaseYear}</span>}
              <span className={cn("rounded-sm px-1.5 py-0.5", novel.status === "ONGOING" ? "bg-success/20 text-success" : "bg-foreground/10")}>
                {novel.status === "ONGOING" ? "• Ongoing" : novel.status.toLowerCase()}
              </span>
            </div>
            <h1 className="mt-2 text-3xl leading-tight font-bold text-balance sm:text-4xl">{novel.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Story <span className="font-medium text-foreground">{novel.author}</span>
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span>
                <strong className="font-semibold tabular-nums">{formatCompact(novel.views)}</strong> <span className="text-muted-foreground">reads</span>
              </span>
              <span>
                <strong className="font-semibold tabular-nums">{state.chapterCount}</strong> <span className="text-muted-foreground">chapters</span>
              </span>
              <a href="#reviews" className="flex items-center gap-1 hover:text-primary">
                <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                <strong className="font-semibold tabular-nums">{novel.ratingCount ? novel.ratingAvg.toFixed(1) : "–"}</strong>
                <span className="text-muted-foreground">({novel.ratingCount})</span>
              </a>
              <span className="text-muted-foreground">{Math.max(1, Math.round(state.wordCount / 230 / 60))}h to read</span>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {startNumber && (
                <Button asChild size="lg" className="min-w-56 justify-between">
                  <Link href={`/novels/${slug}/${startNumber}`}>
                    <span>{resume ? "Continue reading" : "Start reading"}</span>
                    <span className="text-xs opacity-80">Ch. {startNumber}</span>
                  </Link>
                </Button>
              )}
              <LibraryButton novelId={novel.id} inLibrary={state.inLibrary} signedIn={Boolean(viewer)} />
            </div>
            {upcoming.length > 0 && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5 text-primary" aria-hidden />
                Chapter {upcoming[0].number} releases{" "}
                <time suppressHydrationWarning dateTime={upcoming[0].publishedAt!.toISOString()} className="font-medium text-foreground">
                  {formatDistanceToNowStrict(upcoming[0].publishedAt!, { addSuffix: true })}
                </time>
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-10">
          <p className="leading-relaxed text-pretty text-foreground/85">{novel.synopsis}</p>

          {/* ── Chapters ── */}
          <section id="chapters" className="scroll-mt-20">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Chapters</h2>
              <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
                <Link
                  href={listHref({ order: "desc", page: 1 })}
                  aria-label="Newest first"
                  className={cn("rounded p-1.5", order === "desc" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  <ArrowDown className="size-4" />
                </Link>
                <Link
                  href={listHref({ order: "asc", page: 1 })}
                  aria-label="Oldest first"
                  className={cn("rounded p-1.5", order === "asc" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  <ArrowUp className="size-4" />
                </Link>
              </div>
            </div>
            {list.items.length ? (
              <ol className="space-y-1">
                {list.items.map((c) => {
                  const read = resume !== undefined && c.number < resume;
                  const current = c.number === resume;
                  const locked = c.state === "early-access" && !c.unlocked;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/novels/${slug}/${c.number}`}
                        className={cn("group flex items-center gap-3 rounded-md border bg-card px-3 py-2.5 text-sm hover:border-primary/50", read && "opacity-60")}
                      >
                        <span className="w-14 shrink-0 font-medium tabular-nums">Ch. {c.number}</span>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground group-hover:text-foreground">{c.title}</span>
                        {locked && (
                          <span className="flex shrink-0 items-center gap-1 text-xs text-primary tabular-nums">
                            <LockKeyhole className="size-3" /> {c.unlockPrice}
                          </span>
                        )}
                        {current && <span className="shrink-0 text-xs text-primary">Reading</span>}
                        <time suppressHydrationWarning className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                          {c.publishedAt && formatDistanceToNowStrict(c.publishedAt, { addSuffix: true })}
                        </time>
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            read ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                          )}
                          aria-label={read ? "Read" : "Unread"}
                        >
                          {read && <Check className="size-2.5" strokeWidth={3} />}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState title="No chapters yet">The first chapter hasn&apos;t been released. Check the schedule.</EmptyState>
            )}
            {list.pages > 1 && (
              <nav className="mt-3 flex items-center justify-between text-sm" aria-label="Chapter pages">
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
          <section id="reviews" className="scroll-mt-20 space-y-5">
            <h2 className="text-base font-semibold">
              Reviews <span className="font-normal text-muted-foreground">({novel.ratingCount})</span>
            </h2>
            {viewer ? (
              <ReviewForm novelId={novel.id} existing={state.myReview && { rating: state.myReview.rating, body: state.myReview.body }} />
            ) : (
              <SignInToReview />
            )}
            {reviews.length ? <ReviewList reviews={reviews} viewerId={viewer?.id ?? null} /> : <p className="text-sm text-muted-foreground">No reviews yet. Be the first.</p>}
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-8">
          <div>
            <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Genres</h2>
            <div className="flex flex-wrap gap-1.5">
              {novel.genres.map((g) => (
                <Link key={g.slug} href={`/genres/${g.slug}`} className="rounded-md border bg-card px-2.5 py-1 text-xs hover:border-primary hover:text-primary">
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
          {similar.length > 0 && (
            <Section title="Similar novels">
              <ul className="space-y-3">
                {similar.map((n) => (
                  <li key={n.id}>
                    <Link href={`/novels/${n.slug}`} className="group flex items-center gap-3">
                      <NovelCover title={n.title} coverUrl={n.coverUrl} hue={n.coverHue} size="xs" className="w-11" />
                      <div className="min-w-0">
                        <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">{n.genres[0]?.name}</p>
                        <p className="truncate text-sm font-medium group-hover:text-primary">{n.title}</p>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                          <span className="flex items-center gap-0.5">
                            <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                            {n.ratingAvg.toFixed(1)}
                          </span>
                          {formatCompact(n.views)} reads
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}

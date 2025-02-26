import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowRight, BookOpen, Coins, Hourglass, LockKeyholeOpen } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getGenres, getHomeData } from "@/lib/queries";
import { chapterState } from "@/lib/access";
import { NovelCover } from "@/components/NovelCover";
import { NovelCard } from "@/components/novel/NovelCard";
import { ChapterBadge, chapterLabel } from "@/components/novel/ChapterBadge";
import { Section } from "@/components/Section";
import { DemoButtons } from "@/components/site/DemoButtons";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { authEnabled } from "@/lib/flags";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viewer = await getViewer();
  const [home, genres] = await Promise.all([getHomeData(viewer), getGenres()]);
  const [lead, ...rest] = home.featured;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70 dark:opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 85% 20%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%), radial-gradient(40% 40% at 10% 90%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 70%)",
          }}
        />
        <div className="container-page grid items-center gap-12 py-14 md:grid-cols-[1.15fr_1fr] md:py-24">
          <div>
            <p className="mb-4 font-mono text-xs font-semibold tracking-[0.25em] text-primary uppercase">Serial fiction · one chapter at a time</p>
            <h1 className="font-display text-5xl leading-[0.95] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Stories worth staying up&nbsp;for.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-pretty text-muted-foreground">
              Read the back catalogue free. Can&apos;t wait for Friday? Unlock the newest chapters early with credits, and they go free for everyone a week later.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {viewer ? (
                <>
                  <Button asChild size="lg">
                    <Link href={lead ? `/novels/${lead.slug}` : "/novels"}>
                      Start reading <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/novels">Browse the shelf</Link>
                  </Button>
                </>
              ) : (
                <DemoButtons />
              )}
            </div>
            {!viewer && authEnabled && (
              <p className="mt-3 text-sm text-muted-foreground">
                No sign-up: shared demo accounts, Stripe in test mode, reset nightly.
              </p>
            )}
            <dl className="mt-10 flex gap-8 text-sm">
              <div>
                <dt className="text-muted-foreground">Novels</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums">{home.novelCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Chapters out</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums">{home.chapterCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">In early access</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums">{home.earlyAccessCount}</dd>
              </div>
            </dl>
          </div>

          {lead && (
            <Link href={`/novels/${lead.slug}`} className="group relative mx-auto block h-[360px] w-full max-w-[380px] sm:h-[420px]">
              {/* Decorative stack; the link's name comes from the caption below. */}
              <div aria-hidden className="contents">
              {rest.slice(0, 2).map((n, i) => (
                <NovelCover
                  key={n.id}
                  title={n.title}
                  author={n.author}
                  coverUrl={n.coverUrl}
                  hue={n.coverHue}
                  className={
                    i === 0
                      ? "absolute top-6 left-0 w-[46%] -rotate-[9deg] opacity-90 transition-transform duration-500 group-hover:-translate-x-2 group-hover:-rotate-12"
                      : "absolute top-6 right-0 w-[46%] rotate-[9deg] opacity-90 transition-transform duration-500 group-hover:translate-x-2 group-hover:rotate-12"
                  }
                />
              ))}
              <NovelCover
                title={lead.title}
                author={lead.author}
                coverUrl={lead.coverUrl}
                hue={lead.coverHue}
                size="lg"
                priority
                className="absolute top-0 left-1/2 w-[58%] -translate-x-1/2 transition-transform duration-500 group-hover:-translate-y-2"
              />
              </div>
              <div className="absolute inset-x-0 bottom-0 text-center">
                <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Most read this week</p>
                <p className="font-display text-lg font-semibold group-hover:text-primary">{lead.title}</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ── Continue reading ── */}
      {home.continueReading.length > 0 && (
        <Section title="Continue reading" eyebrow="Pick up where you left off" href="/library" hrefLabel="Your library">
          <div className="grid gap-4 sm:grid-cols-2">
            {home.continueReading.map((r) => (
              <Link
                key={r.novel.id}
                href={`/novels/${r.novel.slug}/${r.chapter.number}`}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <NovelCover title={r.novel.title} coverUrl={r.novel.coverUrl} hue={r.novel.coverHue} size="xs" className="w-14" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold group-hover:text-primary">{r.novel.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{chapterLabel(r.chapter.number, r.chapter.title)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={((r.chapter.number - 1 + r.position) / Math.max(1, r.totalChapters)) * 100} className="h-1.5" />
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {r.chapter.number}/{r.totalChapters}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ── Latest chapters ── */}
      <Section title="Fresh off the press" eyebrow="Latest chapters" href="/schedule" hrefLabel="Release schedule">
        <ul className="divide-y rounded-2xl border bg-card">
          {home.latest.map((c) => {
            const state = chapterState(c);
            return (
              <li key={c.id}>
                <Link href={`/novels/${c.novel.slug}/${c.number}`} className="group flex items-center gap-4 px-4 py-3 hover:bg-accent/50">
                  <NovelCover title={c.novel.title} coverUrl={c.novel.coverUrl} hue={c.novel.coverHue} size="xs" className="w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:text-primary">{chapterLabel(c.number, c.title)}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.novel.title}</p>
                  </div>
                  <ChapterBadge state={state} className="hidden sm:inline-flex" />
                  <time className="w-20 shrink-0 text-right text-xs text-muted-foreground" dateTime={c.publishedAt?.toISOString()}>
                    {c.publishedAt && formatDistanceToNowStrict(c.publishedAt, { addSuffix: true })}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ── Top rated ── */}
      <Section title="Readers' favourites" eyebrow="Top rated" href="/novels?sort=rating">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {home.topRated.map((n) => (
            <NovelCard key={n.id} novel={n} />
          ))}
        </div>
      </Section>

      {/* ── How it works ── */}
      <Section title="How Taleverse works" eyebrow="Fair by design">
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "Read the back catalogue free", body: "Every chapter older than a week is free to everyone, forever. No account needed." },
            { icon: Coins, title: "Jump ahead with credits", body: "The newest chapters are early access. Spend a few credits to read them the day they drop." },
            { icon: Hourglass, title: "Then they go free", body: "A week after release, early-access chapters unlock for everyone. You paid for time, not the story." },
          ].map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border bg-card p-6">
              <span className="absolute top-5 right-6 font-display text-5xl font-semibold text-muted-foreground/15">{i + 1}</span>
              <s.icon className="mb-4 size-6 text-primary" aria-hidden />
              <h3 className="font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Genres ── */}
      <Section title="Browse by genre" eyebrow="Find your next obsession">
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link
              key={g.id}
              href={`/genres/${g.slug}`}
              className="rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:border-primary/50 hover:text-primary"
            >
              {g.name} <span className="ml-1 text-muted-foreground tabular-nums">{g._count.novels}</span>
            </Link>
          ))}
          <Link href="/novels" className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
            <LockKeyholeOpen className="size-4" /> Everything
          </Link>
        </div>
      </Section>
    </>
  );
}

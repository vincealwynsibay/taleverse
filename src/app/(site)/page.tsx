import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Flame, LockKeyhole, MessagesSquare, SlidersHorizontal, Star } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { chapterState } from "@/lib/access";
import { authEnabled } from "@/lib/flags";
import { getGenres, getHomeData } from "@/lib/queries";
import { NovelCover } from "@/components/NovelCover";
import { NovelCard } from "@/components/novel/NovelCard";
import { Chip, Section } from "@/components/Section";
import { DemoButtons } from "@/components/site/DemoButtons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

const ago = (d: Date | null) => (d ? formatDistanceToNowStrict(d, { addSuffix: true }) : "");

export default async function HomePage() {
  const viewer = await getViewer();
  const [home, genres] = await Promise.all([getHomeData(viewer), getGenres()]);
  const collage = home.popular.slice(0, 3);

  return (
    <div className="container-page space-y-12 py-8">
      {home.continueReading.length > 0 && (
        <Section title="Continue reading" href="/library">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {home.continueReading.map((r) => (
              <li key={r.novel.id}>
                <Link href={`/novels/${r.novel.slug}/${r.chapter.number}`} className="group flex items-center gap-3 rounded-md border bg-card p-2 hover:border-primary/50">
                  <NovelCover title={r.novel.title} coverUrl={r.novel.coverUrl} hue={r.novel.coverHue} size="xs" className="w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:text-primary">{r.novel.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Ch. {r.chapter.number} of {r.totalChapters}
                    </p>
                    <Progress value={((r.chapter.number - 1 + r.position) / Math.max(1, r.totalChapters)) * 100} className="mt-1.5 h-1" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title="Trending"
        href="/novels"
        aside={
          <Chip href="/novels">
            <SlidersHorizontal className="size-3" /> Filter <span className="opacity-60">All time</span>
          </Chip>
        }
      >
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
          {home.popular.map((n, i) => (
            <NovelCard key={n.id} novel={n} priority={i < 3} />
          ))}
        </div>
      </Section>

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <Section title="Latest updates" href="/schedule">
          <ul className="divide-y rounded-md border bg-card">
            {home.updates.map(({ novel, chapters }) => (
              <li key={novel.id} className="flex gap-3 p-3">
                <Link href={`/novels/${novel.slug}`} className="shrink-0">
                  <NovelCover title={novel.title} coverUrl={novel.coverUrl} hue={novel.coverHue} size="xs" className="w-11" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/novels/${novel.slug}`} className="text-sm font-semibold hover:text-primary">
                    {novel.title}
                  </Link>
                  <ul className="mt-1 space-y-0.5">
                    {chapters.map((c) => {
                      const locked = chapterState(c) === "early-access";
                      return (
                        <li key={c.id} className="flex items-baseline gap-2 text-sm">
                          <Link href={`/novels/${novel.slug}/${c.number}`} className="min-w-0 truncate text-muted-foreground hover:text-foreground">
                            Ch. {c.number}
                            {c.title && ` – ${c.title}`}
                          </Link>
                          {locked && <LockKeyhole className="size-3 shrink-0 text-primary" aria-label="Early access" />}
                          <time suppressHydrationWarning className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums" dateTime={c.publishedAt?.toISOString()}>
                            {ago(c.publishedAt)}
                          </time>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <aside className="space-y-10">
          <Section title="Top rated" href="/novels?sort=rating">
            <ol className="space-y-2.5">
              {home.topRated.map((n, i) => (
                <li key={n.id} className="flex items-center gap-3 text-sm">
                  <span className={i < 3 ? "w-5 text-center font-bold text-primary tabular-nums" : "w-5 text-center text-muted-foreground tabular-nums"}>{i + 1}</span>
                  <Link href={`/novels/${n.slug}`} className="min-w-0 flex-1 truncate hover:text-primary">
                    {n.title}
                  </Link>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground tabular-nums">
                    <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                    {n.ratingAvg.toFixed(1)}
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Coming soon" href="/schedule">
            {home.upcoming.length ? (
              <ul className="space-y-2 text-sm">
                {home.upcoming.map((c) => (
                  <li key={c.id} className="flex items-baseline gap-2">
                    <Link href={`/novels/${c.novel.slug}`} className="min-w-0 flex-1 truncate hover:text-primary">
                      {c.novel.title} <span className="text-muted-foreground">· Ch. {c.number}</span>
                    </Link>
                    <span suppressHydrationWarning className="shrink-0 text-xs text-muted-foreground">
                      {ago(c.publishedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            )}
          </Section>
        </aside>
      </div>

      <Section title="Latest comments" aside={<span className="flex items-center gap-1 text-xs text-muted-foreground"><MessagesSquare className="size-3.5" /> From readers</span>}>
        <ul className="divide-y rounded-md border bg-card">
          {home.comments.map((c) => (
            <li key={c.id} className="flex gap-3 px-3 py-2.5">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/15 text-[0.6rem] font-semibold text-primary">{c.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <span className="font-medium text-primary">{c.user.username}</span>
                  <Link href={`/novels/${c.chapter.novel.slug}/${c.chapter.number}`} className="truncate text-muted-foreground hover:text-foreground">
                    on {c.chapter.novel.title}, Ch. {c.chapter.number}
                  </Link>
                  <time suppressHydrationWarning className="text-muted-foreground">
                    {ago(c.createdAt)}
                  </time>
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm">{c.body}</p>
              </div>
            </li>
          ))}
          {home.comments.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No comments yet.</li>}
        </ul>
      </Section>

      {!viewer && (
        <section className="relative overflow-hidden rounded-lg border bg-card p-6 sm:p-8">
          <div className="max-w-md">
            <h2 className="text-xl font-semibold">Keep track of everything you read</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save novels to your library, pick up where you left off, and unlock new chapters the day they drop.
            </p>
            <div className="mt-5">
              {authEnabled ? (
                <DemoButtons className="[&_button]:h-9 [&_button]:px-4 [&_button]:text-sm" />
              ) : (
                <p className="text-xs text-muted-foreground">Accounts need Clerk keys on this server (see README).</p>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute top-1/2 right-6 hidden -translate-y-1/2 sm:flex" aria-hidden>
            {collage.map((n, i) => (
              <NovelCover
                key={n.id}
                title={n.title}
                author={n.author}
                coverUrl={n.coverUrl}
                hue={n.coverHue}
                size="sm"
                className={["w-24 -rotate-6 shadow-lg", "z-10 -ml-6 w-28 shadow-xl", "-ml-6 w-24 rotate-6 shadow-lg"][i]}
              />
            ))}
          </div>
        </section>
      )}

      <Section
        title="Top rated"
        href="/novels?sort=rating"
        aside={
          <Chip href="/novels?sort=rating">
            <Flame className="size-3" /> Readers&apos; picks
          </Chip>
        }
      >
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
          {home.topRatedCards.map((n) => (
            <NovelCard key={n.id} novel={n} />
          ))}
        </div>
      </Section>

      <Section title="Genres">
        <ul className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <li key={g.id}>
              <Link href={`/genres/${g.slug}`} className="block rounded-md border bg-card px-3 py-1.5 text-sm hover:border-primary hover:text-primary">
                {g.name} <span className="text-muted-foreground tabular-nums">{g._count.novels}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

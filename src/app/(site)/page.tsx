import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { LockKeyhole } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { chapterState } from "@/lib/access";
import { authEnabled } from "@/lib/flags";
import { getGenres, getHomeData } from "@/lib/queries";
import { NovelCover } from "@/components/NovelCover";
import { NovelCard } from "@/components/novel/NovelCard";
import { Section } from "@/components/Section";
import { DemoButtons } from "@/components/site/DemoButtons";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

const ago = (d: Date | null) => (d ? formatDistanceToNowStrict(d, { addSuffix: true }) : "");

export default async function HomePage() {
  const viewer = await getViewer();
  const [home, genres] = await Promise.all([getHomeData(viewer), getGenres()]);

  return (
    <div className="container-page space-y-10 py-6">
      {!viewer && authEnabled && (
        <div className="flex flex-col gap-3 rounded-md border bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-medium">Looking around?</span>{" "}
            <span className="text-muted-foreground">Use a shared demo account. The reader has 25 credits; the admin can schedule chapters.</span>
          </p>
          <DemoButtons className="shrink-0 [&_button]:h-8 [&_button]:px-3 [&_button]:text-sm" />
        </div>
      )}

      {home.continueReading.length > 0 && (
        <Section title="Continue reading" href="/library" hrefLabel="Library">
          <ul className="grid gap-2 sm:grid-cols-2">
            {home.continueReading.map((r) => (
              <li key={r.novel.id}>
                <Link href={`/novels/${r.novel.slug}/${r.chapter.number}`} className="group flex items-center gap-3 rounded-md border p-2 hover:bg-accent">
                  <NovelCover title={r.novel.title} coverUrl={r.novel.coverUrl} hue={r.novel.coverHue} size="xs" className="w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:text-primary">{r.novel.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Chapter {r.chapter.number} of {r.totalChapters}
                    </p>
                    <Progress value={((r.chapter.number - 1 + r.position) / Math.max(1, r.totalChapters)) * 100} className="mt-1.5 h-1" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Popular" href="/novels">
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-6">
          {home.popular.map((n, i) => (
            <NovelCard key={n.id} novel={n} priority={i < 3} />
          ))}
        </div>
      </Section>

      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <Section title="Latest updates" href="/schedule" hrefLabel="Schedule">
          <ul className="divide-y">
            {home.updates.map(({ novel, chapters }) => (
              <li key={novel.id} className="flex gap-3 py-3">
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

        <aside className="space-y-8">
          <Section title="Top rated" href="/novels?sort=rating">
            <ol className="space-y-2">
              {home.topRated.map((n, i) => (
                <li key={n.id} className="flex items-baseline gap-3 text-sm">
                  <span className={i < 3 ? "w-4 font-semibold text-primary tabular-nums" : "w-4 text-muted-foreground tabular-nums"}>{i + 1}</span>
                  <Link href={`/novels/${n.slug}`} className="min-w-0 flex-1 truncate hover:text-primary">
                    {n.title}
                  </Link>
                  <span className="text-xs text-muted-foreground tabular-nums">★ {n.ratingAvg.toFixed(1)}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Coming soon" href="/schedule" hrefLabel="All">
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

          <Section title="Genres">
            <ul className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <li key={g.id}>
                  <Link href={`/genres/${g.slug}`} className="block rounded border px-2 py-1 text-xs hover:border-primary hover:text-primary">
                    {g.name} <span className="text-muted-foreground">{g._count.novels}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <p className="text-xs leading-relaxed text-muted-foreground">
            New chapters are early access for a week (unlock with credits), then free for everyone.
          </p>
        </aside>
      </div>
    </div>
  );
}

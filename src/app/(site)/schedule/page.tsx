import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict, isToday, isTomorrow } from "date-fns";
import { CalendarClock, Gift } from "lucide-react";
import { getSchedule } from "@/lib/queries";
import { NovelCover } from "@/components/NovelCover";
import { EmptyState } from "@/components/Section";

export const metadata: Metadata = { title: "Release schedule" };
export const dynamic = "force-dynamic";

const dayLabel = (d: Date) => (isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEEE, MMM d"));

function groupByDay<T>(items: T[], date: (t: T) => Date) {
  const groups = new Map<string, { label: string; items: T[] }>();
  for (const item of items) {
    const d = date(item);
    const key = format(d, "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, { label: dayLabel(d), items: [] });
    groups.get(key)!.items.push(item);
  }
  return [...groups.values()];
}

export default async function SchedulePage() {
  const { upcoming, goingFree } = await getSchedule();
  const days = groupByDay(upcoming, (c) => c.publishedAt!);

  return (
    <div className="container-page py-10">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-2xl font-semibold">Release schedule</h1>
        <p className="mt-2 text-muted-foreground">
          New chapters land in early access on their release date, then go free for everyone a week later.
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="upcoming">
          <h2 id="upcoming" className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CalendarClock className="size-5 text-primary" aria-hidden /> Coming up
          </h2>
          {days.length ? (
            <ol className="relative space-y-8 border-l pl-6">
              {days.map((day) => (
                <li key={day.label}>
                  <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary ring-4 ring-background" aria-hidden />
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">{day.label}</h3>
                  <ul className="space-y-2">
                    {day.items.map((c) => (
                      <li key={c.id}>
                        <Link href={`/novels/${c.novel.slug}`} className="group flex items-center gap-4 rounded-md border bg-card p-3 hover:border-primary/40">
                          <NovelCover title={c.novel.title} coverUrl={c.novel.coverUrl} hue={c.novel.coverHue} size="xs" className="w-10" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium group-hover:text-primary">{c.novel.title}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              Chapter {c.number}
                              {c.title && `: ${c.title}`}
                            </p>
                          </div>
                          <time className="shrink-0 text-sm text-muted-foreground tabular-nums" dateTime={c.publishedAt!.toISOString()}>
                            {format(c.publishedAt!, "h:mm a")}
                          </time>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Nothing scheduled">Every chapter is out. Check back soon.</EmptyState>
          )}
        </section>

        <section aria-labelledby="free-soon">
          <h2 id="free-soon" className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Gift className="size-5 text-primary" aria-hidden /> Going free soon
          </h2>
          <ul className="divide-y rounded-md border bg-card">
            {goingFree.map((c) => (
              <li key={c.id}>
                <Link href={`/novels/${c.novel.slug}/${c.number}`} className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:text-primary">{c.novel.title}</p>
                    <p className="text-xs text-muted-foreground">Chapter {c.number}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">free {formatDistanceToNowStrict(c.freeAt!, { addSuffix: true })}</span>
                </Link>
              </li>
            ))}
            {goingFree.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">No chapters in early access right now.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

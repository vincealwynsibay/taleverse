import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { BookOpenText, CalendarClock, Coins, LockKeyholeOpen, Plus, Users } from "lucide-react";
import { getAdminOverview } from "@/lib/queries";
import { NovelCover } from "@/components/NovelCover";
import { StatusPill } from "@/components/novel/NovelCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const { stats, recentSales, novels } = await getAdminOverview();
  const cards = [
    { label: "Published chapters", value: stats.chapters, sub: `${stats.novels} novels`, icon: BookOpenText },
    { label: "Scheduled", value: stats.upcoming, sub: "chapters queued", icon: CalendarClock },
    { label: "Credits sold", value: stats.creditsSold, sub: `${stats.purchases} purchases`, icon: Coins },
    { label: "Chapter unlocks", value: stats.unlocks, sub: `${stats.creditsSpent} credits spent`, icon: LockKeyholeOpen },
    { label: "Readers", value: stats.readers, sub: "signed-up accounts", icon: Users },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="text-sm text-muted-foreground">Your catalogue, release queue and revenue at a glance.</p>
        </div>
        <Button asChild>
          <Link href="/admin/novels/new">
            <Plus /> New novel
          </Link>
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-md border bg-card p-4">
            <dt className="flex items-center gap-2 text-xs text-muted-foreground">
              <c.icon className="size-4" aria-hidden /> {c.label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums">{c.value.toLocaleString()}</dd>
            <dd className="text-xs text-muted-foreground">{c.sub}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-3 text-base font-semibold">Novels</h2>
          <div className="overflow-hidden rounded-md border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="hidden px-4 py-2 font-medium sm:table-cell">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Chapters</th>
                  <th className="hidden px-4 py-2 text-right font-medium md:table-cell">Rating</th>
                  <th className="hidden px-4 py-2 text-right font-medium md:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {novels.map((n) => (
                  <tr key={n.id} className="hover:bg-accent/40">
                    <td className="px-4 py-2">
                      <Link href={`/admin/novels/${n.slug}`} className="flex items-center gap-3 font-medium hover:text-primary">
                        <NovelCover title={n.title} coverUrl={n.coverUrl} hue={n.coverHue} size="xs" className="w-8" />
                        <span className="line-clamp-1">{n.title}</span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-2 sm:table-cell">
                      <StatusPill status={n.status} />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{n._count.chapters}</td>
                    <td className="hidden px-4 py-2 text-right tabular-nums md:table-cell">{n.ratingCount ? n.ratingAvg.toFixed(1) : "–"}</td>
                    <td className="hidden px-4 py-2 text-right text-muted-foreground md:table-cell">
                      {formatDistanceToNowStrict(n.updatedAt, { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Recent activity</h2>
          <ol className="divide-y rounded-md border bg-card">
            {recentSales.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{e.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.user.username} · {formatDistanceToNowStrict(e.createdAt, { addSuffix: true })}
                  </p>
                </div>
                <span className={cn("shrink-0 text-sm font-semibold tabular-nums", e.kind === "PURCHASE" ? "text-success" : "text-muted-foreground")}>
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </span>
              </li>
            ))}
            {recentSales.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">No purchases or unlocks yet.</li>}
          </ol>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { NovelCover } from "@/components/NovelCover";
import { RatingStars } from "@/components/RatingStars";
import type { NovelCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function NovelCard({ novel, className, priority }: { novel: NovelCardData; className?: string; priority?: boolean }) {
  return (
    <Link href={`/novels/${novel.slug}`} className={cn("group flex flex-col gap-3", className)}>
      <NovelCover
        title={novel.title}
        author={novel.author}
        coverUrl={novel.coverUrl}
        hue={novel.coverHue}
        priority={priority}
        className="w-full transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-0.6deg]"
      />
      <div className="space-y-1">
        <h3 className="line-clamp-2 font-display text-[1.05rem] leading-snug font-semibold group-hover:text-primary">{novel.title}</h3>
        <p className="truncate text-sm text-muted-foreground">{novel.author}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {novel.ratingCount > 0 && (
            <span className="flex items-center gap-1">
              <RatingStars value={novel.ratingAvg} size={12} />
              <span className="tabular-nums">{novel.ratingAvg.toFixed(1)}</span>
            </span>
          )}
          {novel.chapterCount !== undefined && (
            <span className="flex items-center gap-1 tabular-nums">
              <BookOpenText className="size-3.5" aria-hidden /> {novel.chapterCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function NovelRow({ novel }: { novel: NovelCardData }) {
  return (
    <Link href={`/novels/${novel.slug}`} className="group flex gap-4 rounded-xl p-3 transition-colors hover:bg-accent/60 sm:gap-5">
      <NovelCover title={novel.title} author={novel.author} coverUrl={novel.coverUrl} hue={novel.coverHue} size="sm" className="w-20 sm:w-24" />
      <div className="min-w-0 flex-1 space-y-1.5 py-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-display text-lg leading-snug font-semibold group-hover:text-primary">{novel.title}</h3>
          <StatusPill status={novel.status} />
        </div>
        <p className="text-sm text-muted-foreground">{novel.author}</p>
        <p className="line-clamp-2 text-sm text-foreground/80">{novel.synopsis}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          {novel.ratingCount > 0 && (
            <span className="flex items-center gap-1.5">
              <RatingStars value={novel.ratingAvg} size={12} />
              <span className="tabular-nums">
                {novel.ratingAvg.toFixed(1)} ({novel.ratingCount})
              </span>
            </span>
          )}
          {novel.chapterCount !== undefined && <span className="tabular-nums">{novel.chapterCount} chapters</span>}
          <span>{novel.genres.map((g) => g.name).join(" · ")}</span>
        </div>
      </div>
    </Link>
  );
}

export function StatusPill({ status }: { status: "ONGOING" | "COMPLETED" | "HIATUS" }) {
  const styles = {
    ONGOING: "bg-success/12 text-success ring-success/25",
    COMPLETED: "bg-muted text-muted-foreground ring-border",
    HIATUS: "bg-warning/15 text-warning ring-warning/30",
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase ring-1", styles)}>
      {status === "ONGOING" && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
      {status.toLowerCase()}
    </span>
  );
}

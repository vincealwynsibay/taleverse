import { Clock, LockKeyhole, LockKeyholeOpen, Sparkles } from "lucide-react";
import type { ChapterState } from "@/lib/access";
import { cn } from "@/lib/utils";

/** Small label for a chapter's release state from the reader's point of view. */
export function ChapterBadge({ state, unlocked, className }: { state: ChapterState; unlocked?: boolean; className?: string }) {
  if (state === "free") return null;
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium whitespace-nowrap";
  if (state === "early-access" && unlocked) {
    return (
      <span className={cn(base, "bg-success/12 text-success", className)}>
        <LockKeyholeOpen className="size-3" aria-hidden /> Unlocked
      </span>
    );
  }
  if (state === "early-access") {
    return (
      <span className={cn(base, "bg-primary/12 text-primary", className)}>
        <LockKeyhole className="size-3" aria-hidden /> Early access
      </span>
    );
  }
  if (state === "scheduled") {
    return (
      <span className={cn(base, "bg-muted text-muted-foreground", className)}>
        <Clock className="size-3" aria-hidden /> Scheduled
      </span>
    );
  }
  return (
    <span className={cn(base, "bg-muted text-muted-foreground", className)}>
      <Sparkles className="size-3" aria-hidden /> Draft
    </span>
  );
}

export function chapterLabel(number: number, title?: string | null) {
  return title ? `Chapter ${number}: ${title}` : `Chapter ${number}`;
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { CalendarClock, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { scheduleChapterAction } from "@/app/actions/admin";
import { chapterState } from "@/lib/access";
import { ChapterBadge } from "@/components/novel/ChapterBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "draft" | "now" | "later";
const local = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

/**
 * Release controls for one chapter: draft / publish now / schedule, plus an
 * optional early-access window (free date) and its credit price.
 */
export function SchedulePanel({
  chapterId,
  publishedAt,
  freeAt,
  unlockPrice,
  compact,
}: {
  chapterId: number;
  publishedAt: Date | null;
  freeAt: Date | null;
  unlockPrice: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const now = new Date();
  const [mode, setMode] = useState<Mode>(!publishedAt ? "draft" : publishedAt > now ? "later" : "now");
  const [publishAt, setPublishAt] = useState(local(publishedAt && publishedAt > now ? publishedAt : addDays(now, 1)));
  const [early, setEarly] = useState(Boolean(freeAt));
  const [freeAtValue, setFreeAtValue] = useState(local(freeAt ?? addDays(publishedAt && publishedAt > now ? publishedAt : now, 7)));
  const [price, setPrice] = useState(unlockPrice);

  const state = chapterState({ publishedAt, freeAt }, now);

  const save = () =>
    start(async () => {
      const publish = mode === "draft" ? null : mode === "now" ? (publishedAt && publishedAt <= now ? publishedAt : new Date()) : new Date(publishAt);
      const res = await scheduleChapterAction(chapterId, {
        publishedAt: publish?.toISOString() ?? null,
        freeAt: publish && early ? new Date(freeAtValue).toISOString() : null,
        unlockPrice: price,
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(mode === "draft" ? "Saved as draft" : mode === "now" ? "Chapter is live" : `Scheduled for ${format(new Date(publishAt), "MMM d, h:mm a")}`);
        router.refresh();
      }
    });

  return (
    <div className={cn("space-y-4", !compact && "rounded-md border bg-card p-4")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="size-4 text-primary" aria-hidden /> Release
        </h3>
        <ChapterBadge state={state} />
        {state === "free" && <span className="text-xs font-medium text-success">Live · free</span>}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-sm" role="radiogroup" aria-label="Release mode">
        {(
          [
            ["draft", "Draft"],
            ["now", "Publish"],
            ["later", "Schedule"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn("rounded-md px-2 py-1.5", mode === m ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "later" && (
        <div className="space-y-1.5">
          <Label htmlFor={`publish-${chapterId}`}>Release at</Label>
          <Input id={`publish-${chapterId}`} type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
        </div>
      )}

      {mode !== "draft" && (
        <div className="space-y-3 rounded-md border border-dashed p-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={early} onChange={(e) => setEarly(e.target.checked)} className="mt-0.5 accent-primary" />
            <span>
              <span className="font-medium">Early access</span>
              <span className="block text-xs text-muted-foreground">Readers pay credits until the free date.</span>
            </span>
          </label>
          {early && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`free-${chapterId}`}>Free for everyone at</Label>
                <Input id={`free-${chapterId}`} type="datetime-local" value={freeAtValue} onChange={(e) => setFreeAtValue(e.target.value)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`price-${chapterId}`}>Price in credits</Label>
                <Input
                  id={`price-${chapterId}`}
                  type="number"
                  min={1}
                  max={100}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-20 text-right tabular-nums"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <Button onClick={save} disabled={pending} className="w-full">
        {pending && <LoaderCircle className="animate-spin" />}
        {mode === "draft" ? "Save as draft" : mode === "now" ? "Publish" : "Schedule release"}
      </Button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { saveChapterAction } from "@/app/actions/admin";
import { Skeleton } from "@/components/ui/skeleton";

// BlockNote touches the DOM on import; keep it out of the server render.
const ChapterEditor = dynamic(() => import("./ChapterEditor"), {
  ssr: false,
  loading: () => (
    <div className="space-y-3 pt-2">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-11/12" />
      <Skeleton className="h-5 w-4/5" />
    </div>
  ),
});

type Status = { kind: "saved"; at: Date } | { kind: "dirty" } | { kind: "saving" } | { kind: "error"; message: string };

/** Title + body editor with debounced autosave, ⌘S, and an unsaved-changes guard. */
export function ChapterWorkbench({ chapterId, number, initialTitle, initialContent, updatedAt }: {
  chapterId: number;
  number: number;
  initialTitle: string;
  initialContent: unknown[];
  updatedAt: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<Status>({ kind: "saved", at: new Date(updatedAt) });
  const latest = useRef({ title: initialTitle, content: JSON.stringify(initialContent) });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    setStatus({ kind: "saving" });
    const res = await saveChapterAction(chapterId, latest.current);
    setStatus(res.ok ? { kind: "saved", at: new Date(res.data.savedAt) } : { kind: "error", message: res.error });
  }, [chapterId]);

  const schedule = useCallback(() => {
    setStatus({ kind: "dirty" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 1200);
  }, [save]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (status.kind === "dirty" || status.kind === "saving") e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, status.kind]);

  return (
    <div className="rounded-2xl border bg-card px-6 py-6 sm:px-10">
      <div className="mb-6 flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span className="font-semibold tracking-[0.2em] uppercase">Chapter {number}</span>
        <span aria-live="polite" className="flex items-center gap-1.5">
          {status.kind === "saving" && (
            <>
              <LoaderCircle className="size-3.5 animate-spin" /> Saving…
            </>
          )}
          {status.kind === "dirty" && "Unsaved changes"}
          {status.kind === "saved" && (
            <>
              <Check className="size-3.5 text-success" /> Saved {format(status.at, "h:mm a")}
            </>
          )}
          {status.kind === "error" && (
            <span className="flex items-center gap-1.5 text-destructive">
              <CircleAlert className="size-3.5" /> {status.message}
            </span>
          )}
        </span>
      </div>
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          latest.current.title = e.target.value;
          schedule();
        }}
        placeholder="Chapter title (optional)"
        aria-label="Chapter title"
        maxLength={150}
        className="mb-6 w-full bg-transparent font-display text-3xl font-semibold outline-none placeholder:text-muted-foreground/50"
      />
      <ChapterEditor
        initial={initialContent}
        onChange={(json) => {
          latest.current.content = json;
          schedule();
        }}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, List, LockKeyhole, Minus, Plus, Type, Undo2 } from "lucide-react";
import { saveProgressAction } from "@/app/actions/reader";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LEADINGS,
  READER_COOKIE,
  SIZES,
  WIDTHS,
  readerStyle,
  type ReaderSettings,
} from "@/lib/reader-settings";

type TocItem = { number: number; title: string; locked: boolean };

type Props = {
  novel: { slug: string; title: string };
  chapter: { id: number; number: number; title: string };
  prev: number | null;
  next: number | null;
  toc: TocItem[];
  initialSettings: ReaderSettings;
  signedIn: boolean;
  trackProgress: boolean;
  savedPosition: number;
  children: React.ReactNode;
  /** Rendered below the chapter navigation (comments). */
  footer?: React.ReactNode;
};

function scrollFraction() {
  const el = document.getElementById("chapter-body");
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const total = rect.height - window.innerHeight * 0.6;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, -rect.top / total));
}

export function ReaderShell({ novel, chapter, prev, next, toc, initialSettings, signedIn, trackProgress, savedPosition, children, footer }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [barVisible, setBarVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showResume, setShowResume] = useState(savedPosition > 0.03 && savedPosition < 0.97);
  const lastY = useRef(0);
  const lastSaved = useRef(-1);

  const update = (patch: Partial<ReaderSettings>) => {
    setSettings((s) => {
      const nextSettings = { ...s, ...patch };
      document.cookie = `${READER_COOKIE}=${encodeURIComponent(JSON.stringify(nextSettings))}; path=/; max-age=31536000; samesite=lax`;
      return nextSettings;
    });
  };

  const save = useCallback(
    (force = false) => {
      if (!signedIn || !trackProgress) return;
      const f = Math.round(scrollFraction() * 100) / 100;
      if (!force && Math.abs(f - lastSaved.current) < 0.05) return;
      lastSaved.current = f;
      void saveProgressAction(chapter.id, f);
    },
    [chapter.id, signedIn, trackProgress],
  );

  // Hide the bar while reading down, show it on scroll up; track progress.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setBarVisible(y < 80 || y < lastY.current);
        lastY.current = y;
        setProgress(scrollFraction());
        if (y > 200) setShowResume(false);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Save progress periodically and when leaving.
  useEffect(() => {
    if (!signedIn || !trackProgress) return;
    save(true);
    const interval = setInterval(() => save(), 5000);
    const onHide = () => document.visibilityState === "hidden" && save(true);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      save(true);
    };
  }, [save, signedIn, trackProgress]);

  // ← / → between chapters.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft" && prev) router.push(`/novels/${novel.slug}/${prev}`);
      if (e.key === "ArrowRight" && next) router.push(`/novels/${novel.slug}/${next}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, novel.slug, router]);

  const jumpToSaved = () => {
    const el = document.getElementById("chapter-body");
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight * 0.6;
    window.scrollTo({ top: top + total * savedPosition, behavior: "smooth" });
    setShowResume(false);
  };

  return (
    <div
      data-reader-theme={settings.theme === "auto" ? undefined : settings.theme}
      style={readerStyle(settings)}
      className="min-h-dvh bg-reader-bg text-reader-fg transition-colors"
    >
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b border-current/10 bg-reader-bg/90 backdrop-blur-md transition-transform duration-300",
          !barVisible && "-translate-y-full",
        )}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3">
          <Button asChild variant="ghost" size="icon" aria-label={`Back to ${novel.title}`}>
            <Link href={`/novels/${novel.slug}`}>
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{novel.title}</p>
            <p className="truncate text-xs opacity-60">Chapter {chapter.number}</p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Chapter list">
                <List />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[90vw] max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Chapters</SheetTitle>
                <SheetDescription>{novel.title}</SheetDescription>
              </SheetHeader>
              <ol className="px-2 pb-6">
                {toc.map((c) => (
                  <li key={c.number}>
                    <Link
                      href={`/novels/${novel.slug}/${c.number}`}
                      aria-current={c.number === chapter.number ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent",
                        c.number === chapter.number && "bg-accent font-semibold",
                      )}
                    >
                      <span className="w-6 text-right text-muted-foreground tabular-nums">{c.number}</span>
                      <span className="min-w-0 flex-1 truncate">{c.title || `Chapter ${c.number}`}</span>
                      {c.locked && <LockKeyhole className="size-3.5 text-primary" aria-label="Early access" />}
                    </Link>
                  </li>
                ))}
              </ol>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Reading settings">
                <Type />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[90vw] max-w-sm">
              <SheetHeader>
                <SheetTitle>Reading settings</SheetTitle>
                <SheetDescription>Saved on this device.</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4">
                <Setting label="Typeface">
                  <Segmented
                    value={settings.font}
                    onChange={(font) => update({ font })}
                    options={[
                      { value: "serif", label: <span className="font-serif">Literata</span> },
                      { value: "sans", label: <span className="font-sans">Inter</span> },
                    ]}
                  />
                </Setting>
                <Setting label="Text size">
                  <Stepper value={settings.size} max={SIZES.length - 1} onChange={(size) => update({ size })} />
                </Setting>
                <Setting label="Line spacing">
                  <Segmented
                    value={String(settings.leading)}
                    onChange={(v) => update({ leading: Number(v) })}
                    options={LEADINGS.map((_, i) => ({ value: String(i), label: ["Compact", "Comfy", "Airy"][i] }))}
                  />
                </Setting>
                <Setting label="Page width">
                  <Segmented
                    value={String(settings.width)}
                    onChange={(v) => update({ width: Number(v) })}
                    options={WIDTHS.map((_, i) => ({ value: String(i), label: ["Narrow", "Medium", "Wide"][i] }))}
                  />
                </Setting>
                <Setting label="Theme">
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        ["auto", "Auto", "bg-gradient-to-br from-white to-zinc-800"],
                        ["paper", "Paper", "bg-[oklch(0.975_0.008_80)]"],
                        ["sepia", "Sepia", "bg-[oklch(0.93_0.035_80)]"],
                        ["night", "Night", "bg-[oklch(0.16_0.012_265)]"],
                      ] as const
                    ).map(([value, label, swatch]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update({ theme: value })}
                        aria-pressed={settings.theme === value}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs",
                          settings.theme === value ? "border-primary ring-2 ring-primary/30" : "hover:bg-accent",
                        )}
                      >
                        <span className={cn("size-7 rounded-full border", swatch)} />
                        {label}
                      </button>
                    ))}
                  </div>
                </Setting>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="h-0.5 bg-current/5">
          <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      {showResume && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <Button onClick={jumpToSaved} className="rounded-full shadow-lg">
            <Undo2 /> Jump to where you left off ({Math.round(savedPosition * 100)}%)
          </Button>
        </div>
      )}

      <div className={cn("pt-14", settings.font === "serif" ? "font-serif" : "font-sans")}>{children}</div>

      <nav className="mx-auto flex max-w-[var(--reader-width)] gap-3 px-5 pb-6" aria-label="Chapter navigation">
        {prev ? (
          <Button asChild variant="outline" size="lg" className="flex-1 border-current/20 bg-transparent text-reader-fg hover:bg-current/5 dark:border-current/20 dark:bg-transparent dark:hover:bg-current/5">
            <Link href={`/novels/${novel.slug}/${prev}`}>
              <ChevronLeft /> Previous
            </Link>
          </Button>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Button asChild size="lg" className="flex-1">
            <Link href={`/novels/${novel.slug}/${next}`}>
              Next chapter <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="lg" className="flex-1 border-current/20 bg-transparent text-reader-fg hover:bg-current/5 dark:border-current/20 dark:bg-transparent dark:hover:bg-current/5">
            <Link href={`/novels/${novel.slug}`}>Back to novel</Link>
          </Button>
        )}
      </nav>
      {footer}
    </div>
  );
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2 py-1.5 text-sm transition-colors",
            value === o.value ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" aria-label="Smaller text" disabled={value === 0} onClick={() => onChange(value - 1)}>
        <Minus />
      </Button>
      <div className="flex flex-1 justify-center gap-1.5" aria-hidden>
        {Array.from({ length: max + 1 }, (_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= value ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
      <Button variant="outline" size="icon" aria-label="Larger text" disabled={value === max} onClick={() => onChange(value + 1)}>
        <Plus />
      </Button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpToLine,
  BookmarkCheck,
  BookmarkPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Expand,
  Headphones,
  House,
  Pause,
  Play,
  Shrink,
  SlidersHorizontal,
  Square,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { saveProgressAction, toggleLibraryAction } from "@/app/actions/reader";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { READER_COOKIE, SCROLL_SPEEDS, readerStyle, type ReaderSettings } from "@/lib/reader-settings";
import { chapterFraction, scrollToFraction, useAutoScroll, useMediaQuery, useReadAloud } from "./hooks";
import { ChapterList, ReaderSettingsPanel, TTS_RATES, type TocItem } from "./ReaderPanels";

type Props = {
  novel: { id: number; slug: string; title: string };
  chapter: { id: number; number: number; title: string; wordCount: number };
  prev: number | null;
  next: number | null;
  toc: TocItem[];
  initialSettings: ReaderSettings;
  signedIn: boolean;
  inLibrary: boolean;
  trackProgress: boolean;
  savedPosition: number;
  children: React.ReactNode;
  /** Rendered below the chapter (up-next card, comments). */
  footer?: React.ReactNode;
};

type Panel = "chapters" | "settings" | null;

/** Floating rounded control, styled against the current reading theme. */
const pill =
  "border border-[color-mix(in_oklch,var(--reader-fg)_14%,transparent)] bg-[color-mix(in_oklch,var(--reader-fg)_7%,var(--reader-bg))] text-reader-fg shadow-[0_4px_16px_rgb(0_0_0/0.18)] backdrop-blur";

/**
 * App-style reader (after chikari.moe). The page is clear while reading; tap it
 * (or move the pointer to an edge on desktop) to bring up floating controls.
 */
export function ReaderShell(props: Props) {
  const { novel, chapter, prev, next, toc, initialSettings, signedIn, trackProgress, savedPosition, children, footer } = props;
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [settings, setSettings] = useState(initialSettings);
  const [chrome, setChrome] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [progress, setProgress] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showResume, setShowResume] = useState(savedPosition > 0.03 && savedPosition < 0.97);
  const [inLibrary, setInLibrary] = useState(props.inLibrary);
  const [libraryPending, startLibrary] = useTransition();
  const lastY = useRef(0);
  const lastSaved = useRef(-1);
  // Sheets lock body scroll and restore it on close; don't read that jump as "reading down".
  const ignoreScrollUntil = useRef(0);
  useEffect(() => {
    ignoreScrollUntil.current = panel ? Number.POSITIVE_INFINITY : performance.now() + 400;
  }, [panel]);

  const auto = useAutoScroll(SCROLL_SPEEDS[settings.speed], settings.autoStyle);
  const tts = useReadAloud();
  const minutesLeft = Math.max(0, Math.ceil(((1 - progress) * chapter.wordCount) / 230));
  const chapterIndex = toc.findIndex((c) => c.number === chapter.number);

  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((s) => {
      const nextSettings = { ...s, ...patch };
      document.cookie = `${READER_COOKIE}=${encodeURIComponent(JSON.stringify(nextSettings))}; path=/; max-age=31536000; samesite=lax`;
      return nextSettings;
    });
  }, []);

  const go = useCallback((n: number | null) => n && router.push(`/novels/${novel.slug}/${n}`), [novel.slug, router]);

  // ── Progress saving ──
  const save = useCallback(
    (force = false) => {
      if (!signedIn || !trackProgress) return;
      const f = Math.round(chapterFraction() * 100) / 100;
      if (!force && Math.abs(f - lastSaved.current) < 0.05) return;
      lastSaved.current = f;
      void saveProgressAction(chapter.id, f);
    },
    [chapter.id, signedIn, trackProgress],
  );

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

  // ── Scroll: progress; reading down hides the controls; the end shows them ──
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const f = chapterFraction();
        setProgress(f);
        if (y > lastY.current + 8 && y > 120 && performance.now() > ignoreScrollUntil.current) setChrome(false);
        if (f >= 0.995) setChrome(true);
        lastY.current = y;
        if (y > 200) setShowResume(false);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Desktop: pointer near the top or bottom edge reveals the controls.
  useEffect(() => {
    if (!isDesktop) return;
    const onMove = (e: MouseEvent) => {
      if (e.clientY < 70 || e.clientY > window.innerHeight - 140) setChrome(true);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [isDesktop]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const startAuto = useCallback(
    (style: "creep" | "jump" = settings.autoStyle) => {
      tts.stop();
      if (style !== settings.autoStyle) update({ autoStyle: style });
      setChrome(false);
      setPanel(null);
      auto.setPlaying(true);
    },
    [auto, settings.autoStyle, tts, update],
  );
  const toggleAuto = useCallback(() => (auto.playing ? auto.setPlaying(false) : startAuto()), [auto, startAuto]);
  const toggleTts = useCallback(() => {
    auto.setPlaying(false);
    if (!tts.speaking) setChrome(false);
    tts.toggle();
  }, [auto, tts]);

  const toComments = () => {
    setPanel(null);
    document.getElementById("comments-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (e.key === "ArrowLeft") go(prev);
      else if (e.key === "ArrowRight") go(next);
      else if (k === "p") toggleAuto();
      else if (k === "l" && tts.supported) toggleTts();
      else if (k === "c") setPanel("chapters");
      else if (k === "s") setPanel("settings");
      else if (k === "f") toggleFullscreen();
      // Escape closes an open sheet; only toggle the controls when nothing else handles it.
      else if (e.key === "Escape" && !panel && !document.querySelector('[role="dialog"]')) setChrome((c) => !c);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, next, panel, prev, toggleAuto, toggleTts, tts.supported]);

  // Tap: toggle controls, or (tap zones) scroll a screen from the sides.
  const onPageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select, label, [data-no-toggle]")) return;
    if (window.getSelection()?.toString()) return;
    if (auto.playing) return auto.setPlaying(false);
    if (settings.tapZones) {
      const x = e.clientX / window.innerWidth;
      if (x < 0.3) return window.scrollBy({ top: -window.innerHeight * 0.85, behavior: "smooth" });
      if (x > 0.7) return window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
    }
    setChrome((c) => !c);
  };

  const toggleLibrary = () => {
    if (!signedIn) return router.push("/sign-in");
    startLibrary(async () => {
      setInLibrary((v) => !v);
      const res = await toggleLibraryAction(novel.id);
      if (!res.ok) {
        setInLibrary((v) => !v);
        toast.error(res.error);
      } else toast.success(res.data.inLibrary ? "Added to your library" : "Removed from your library");
    });
  };

  const playing = auto.playing || tts.speaking;
  const sheetSide = isDesktop ? "right" : "bottom";
  const sheetClass = isDesktop ? "w-[380px] sm:max-w-[380px] gap-0" : "max-h-[85dvh] gap-0 rounded-t-xl";
  const hiddenTop = !chrome && "pointer-events-none -translate-y-4 opacity-0";
  const hiddenBottom = !chrome && "pointer-events-none translate-y-4 opacity-0";

  return (
    <div
      data-reader-theme={settings.theme === "auto" ? undefined : settings.theme}
      style={readerStyle(settings)}
      className="min-h-dvh bg-reader-bg text-reader-fg transition-colors"
    >
      {/* Fades so the floating controls sit on a clean surface, not on top of text */}
      <div
        aria-hidden
        className={cn("pointer-events-none fixed inset-x-0 top-0 z-30 h-32 bg-gradient-to-b from-reader-bg via-reader-bg/85 to-transparent transition-opacity duration-200", !chrome && "opacity-0")}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-reader-bg via-reader-bg/90 to-transparent transition-all duration-200",
          chrome ? "h-48" : playing ? "h-20" : "h-48 opacity-0",
        )}
      />

      {/* ── Top controls ── */}
      <div className={cn("fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-2 p-3 transition-all duration-200", hiddenTop)} data-no-toggle>
        <div className="flex flex-col gap-2">
          <Link href={`/novels/${novel.slug}`} aria-label={`Back to ${novel.title}`} className={cn(pill, "flex size-10 items-center justify-center rounded-lg")}>
            <ArrowLeft className="size-4" />
          </Link>
          <Link href="/" aria-label="Home" className={cn(pill, "flex size-10 items-center justify-center rounded-lg")}>
            <House className="size-4" />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setPanel("chapters")}
          className={cn(pill, "mt-0.5 min-w-0 max-w-[60vw] truncate rounded-lg px-3 py-2 text-sm font-medium")}
          aria-label="Open chapter list"
        >
          {novel.title}
        </button>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleLibrary}
            disabled={libraryPending}
            aria-pressed={inLibrary}
            aria-label={inLibrary ? "Remove from library" : "Add to library"}
            className={cn(pill, "flex size-10 items-center justify-center rounded-lg")}
          >
            {inLibrary ? <BookmarkCheck className="size-4 text-primary" /> : <BookmarkPlus className="size-4" />}
          </button>
          {isDesktop && (
            <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"} className={cn(pill, "flex size-10 items-center justify-center rounded-lg")}>
              {fullscreen ? <Shrink className="size-4" /> : <Expand className="size-4" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Chapter ── */}
      <main id="main" onClick={onPageClick} className={cn("pt-16", settings.font === "serif" ? "font-serif" : "font-sans")}>
        <div data-paragraphs={settings.paragraphs} data-justify={settings.justify}>
          {children}
        </div>
      </main>

      {footer}
      <div className="h-40" aria-hidden />

      {showResume && (
        <div className="fixed inset-x-0 bottom-40 z-40 flex justify-center px-4">
          <Button
            onClick={() => {
              scrollToFraction(savedPosition, "smooth");
              setShowResume(false);
            }}
            className="rounded-full shadow-lg"
          >
            <Undo2 /> Jump to where you left off ({Math.round(savedPosition * 100)}%)
          </Button>
        </div>
      )}

      {/* ── Always-on indicators (bottom-left) ── */}
      {(settings.showPercent || settings.showChapter) && !chrome && !playing && (
        <div className="pointer-events-none fixed bottom-3 left-3 z-30 flex gap-1.5 text-xs tabular-nums" aria-hidden>
          {settings.showPercent && <span className={cn(pill, "rounded-md px-2 py-1")}>{Math.round(progress * 100)}%</span>}
          {settings.showChapter && (
            <span className={cn(pill, "rounded-md px-2 py-1")}>
              Ch. {chapterIndex + 1}/{toc.length || 1}
            </span>
          )}
        </div>
      )}

      {/* ── Now playing ── */}
      {playing && (
        <div className={cn("fixed inset-x-0 z-40 flex justify-center px-3 transition-all duration-200", chrome ? "bottom-[10.5rem]" : "bottom-3")} data-no-toggle>
          <div className={cn(pill, "flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-sm")}>
            {auto.playing ? (
              <>
                <span className="mr-1 text-xs opacity-70">{settings.autoStyle === "creep" ? "Auto-scroll" : "Page jump"}</span>
                <button type="button" onClick={() => update({ speed: Math.max(0, settings.speed - 1) })} className="rounded-full px-2 py-1 hover:bg-current/10" aria-label="Slower">
                  −
                </button>
                <span className="w-6 text-center text-xs tabular-nums">{settings.speed + 1}×</span>
                <button
                  type="button"
                  onClick={() => update({ speed: Math.min(SCROLL_SPEEDS.length - 1, settings.speed + 1) })}
                  className="rounded-full px-2 py-1 hover:bg-current/10"
                  aria-label="Faster"
                >
                  +
                </button>
                <button type="button" onClick={() => auto.setPlaying(false)} aria-label="Stop auto-scroll" className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Pause className="size-4" />
                </button>
              </>
            ) : (
              <>
                <Headphones className="size-4 text-primary" />
                <span className="mr-1 text-xs opacity-70">Reading aloud</span>
                {TTS_RATES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => tts.setRate(r)}
                    aria-pressed={tts.rate === r}
                    className={cn("rounded-full px-1.5 py-1 text-xs tabular-nums", tts.rate === r ? "bg-current/15 font-medium" : "opacity-60 hover:opacity-100")}
                  >
                    {r}×
                  </button>
                ))}
                <button type="button" onClick={() => tts.stop()} aria-label="Stop reading aloud" className="ml-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Square className="size-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom controls ── */}
      <div className={cn("fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-200", hiddenBottom)} data-no-toggle>
        <div className="mx-auto flex max-w-md flex-col gap-2">
          <div className="flex justify-end">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top" className={cn(pill, "flex size-9 items-center justify-center rounded-lg")}>
              <ArrowUpToLine className="size-4" />
            </button>
          </div>
          {/* scrubber */}
          <div className={cn(pill, "flex items-center gap-3 rounded-lg px-3 py-2 text-xs tabular-nums")}>
            <span className="w-8 shrink-0 opacity-70">{Math.round(progress * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              onChange={(e) => scrollToFraction(Number(e.target.value) / 1000)}
              aria-label="Position in chapter"
              aria-valuetext={`${Math.round(progress * 100)} percent`}
              className="reader-range min-w-0 flex-1"
              style={{ "--fill": `${progress * 100}%` } as React.CSSProperties}
            />
            <span className="shrink-0 text-right whitespace-nowrap opacity-70">{minutesLeft ? `${minutesLeft} min left` : "Done"}</span>
          </div>
          {/* transport */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={toggleAuto}
              aria-label={auto.playing ? "Pause auto-scroll" : "Start auto-scroll"}
              aria-pressed={auto.playing}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_4px_16px_rgb(0_0_0/0.2)]"
            >
              {auto.playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={() => go(prev)} disabled={!prev} aria-label="Previous chapter" className={cn(pill, "flex size-10 shrink-0 items-center justify-center rounded-lg disabled:opacity-40")}>
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" onClick={() => setPanel("chapters")} className={cn(pill, "flex h-10 min-w-0 items-center gap-2 rounded-lg px-4 text-sm font-medium")}>
                <span className="truncate">Chapter {chapter.number}</span>
                <ChevronDown className="size-4 shrink-0 opacity-60" />
              </button>
              <button type="button" onClick={() => go(next)} disabled={!next} aria-label="Next chapter" className={cn(pill, "flex size-10 shrink-0 items-center justify-center rounded-lg disabled:opacity-40")}>
                <ChevronRight className="size-4" />
              </button>
            </div>
            <button type="button" onClick={() => setPanel("settings")} aria-label="Reader settings" className={cn(pill, "flex size-10 shrink-0 items-center justify-center rounded-lg")}>
              <SlidersHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Panels ── */}
      <Sheet open={panel === "chapters"} onOpenChange={(o) => setPanel(o ? "chapters" : null)}>
        <SheetContent side={sheetSide} className={cn(sheetClass, "flex flex-col")}>
          <SheetHeader>
            <SheetTitle>Chapters</SheetTitle>
            <SheetDescription>{novel.title}</SheetDescription>
          </SheetHeader>
          <ChapterList slug={novel.slug} toc={toc} current={chapter.number} onNavigate={() => setPanel(null)} />
        </SheetContent>
      </Sheet>

      <Sheet open={panel === "settings"} onOpenChange={(o) => setPanel(o ? "settings" : null)}>
        <SheetContent side={sheetSide} className={cn(sheetClass, "flex flex-col")}>
          <SheetHeader className="flex-row items-center justify-between">
            <div>
              <SheetTitle className="truncate">{novel.title}</SheetTitle>
              <SheetDescription>Reader settings · saved on this device</SheetDescription>
            </div>
          </SheetHeader>
          <ReaderSettingsPanel
            settings={settings}
            update={update}
            chapter={chapter}
            prev={prev}
            next={next}
            onGo={(n) => {
              setPanel(null);
              go(n);
            }}
            onOpenChapters={() => setPanel("chapters")}
            onComments={toComments}
            auto={{ playing: auto.playing, start: startAuto, stop: () => auto.setPlaying(false) }}
            tts={{ supported: tts.supported, speaking: tts.speaking, toggle: toggleTts, rate: tts.rate, setRate: tts.setRate }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}


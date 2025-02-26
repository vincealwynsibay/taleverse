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
  List,
  Minus,
  Plus,
  Type,
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
import { Pager, type PagerApi } from "./Pager";

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
  /** Open on the last page (arrived by paging back from the next chapter). */
  startAtEnd?: boolean;
  children: React.ReactNode;
  /** Rendered below the chapter (up-next card, comments). */
  footer?: React.ReactNode;
};

type Panel = "chapters" | "settings" | "comments" | null;

/** Seconds per page when auto-turning in paged layout, by speed setting. */
const PAGE_SECONDS = [40, 30, 22, 16, 11];

/** Solid bar docked to a screen edge, styled against the current reading theme. */
const bar = "bg-reader-bg text-reader-fg border-[color-mix(in_oklch,var(--reader-fg)_12%,transparent)]";
const iconBtn =
  "flex size-10 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[color-mix(in_oklch,var(--reader-fg)_8%,transparent)] disabled:opacity-35 disabled:hover:bg-transparent [&_svg]:size-5";

/**
 * App-style reader (after chikari.moe). The page is clear while reading; tap it
 * (or move the pointer to an edge on desktop) to bring up floating controls.
 */
export function ReaderShell(props: Props) {
  const { novel, chapter, prev, next, toc, initialSettings, signedIn, trackProgress, savedPosition, startAtEnd, children, footer } = props;
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
  const fraction = useRef(0);
  const pager = useRef<PagerApi>(null);
  // Paged layout only for readable chapters (a locked chapter shows the paywall in scroll layout).
  const paged = settings.layout === "paged" && trackProgress;
  // Sheets lock body scroll and restore it on close; don't read that jump as "reading down".
  const ignoreScrollUntil = useRef(0);
  useEffect(() => {
    ignoreScrollUntil.current = panel ? Number.POSITIVE_INFINITY : performance.now() + 400;
  }, [panel]);

  const auto = useAutoScroll(SCROLL_SPEEDS[settings.speed], settings.autoStyle, !paged);
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
      const f = Math.round(fraction.current * 100) / 100;
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
        if (document.getElementById("pager-content")) return; // paged layout reports its own progress
        const y = window.scrollY;
        const f = chapterFraction();
        const before = fraction.current;
        fraction.current = f;
        setProgress(f);
        if (y > lastY.current + 8 && y > 120 && performance.now() > ignoreScrollUntil.current) setChrome(false);
        // Reaching the end shows the bars once; scrolling on into the comments hides them again.
        if (f >= 0.995 && before < 0.995) setChrome(true);
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
    if (paged) return setPanel("comments");
    setPanel(null);
    document.getElementById("comments-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Paged layout ──
  const onPagerProgress = useCallback((f: number) => {
    fraction.current = f;
    setProgress(f);
  }, []);
  const toPrevChapterEnd = useCallback(() => prev && router.push(`/novels/${novel.slug}/${prev}?at=end`), [novel.slug, prev, router]);
  const afterLastPage = useCallback(() => {
    if (auto.playing) {
      auto.setPlaying(false);
      setChrome(true);
    } else if (next) go(next);
    else setChrome(true);
  }, [auto, go, next]);

  // Auto-play in paged layout turns pages on a timer.
  useEffect(() => {
    if (!paged || !auto.playing) return;
    const t = setInterval(() => pager.current?.next(), PAGE_SECONDS[settings.speed] * 1000);
    return () => clearInterval(t);
  }, [paged, auto.playing, settings.speed]);

  // Read-aloud announces each block; follow it in either layout.
  useEffect(() => {
    const onReveal = (e: Event) => {
      const el = (e as CustomEvent<HTMLElement>).detail;
      if (paged) pager.current?.reveal(el);
      else el.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    window.addEventListener("reader:reveal", onReveal);
    return () => window.removeEventListener("reader:reveal", onReveal);
  }, [paged]);

  const seek = (f: number) => (paged ? pager.current?.goToFraction(f) : scrollToFraction(f));
  const nextItem = next ? toc.find((c) => c.number === next) : undefined;

  const toggleFullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (paged && (e.key === "ArrowLeft" || e.key === "PageUp")) pager.current?.prev();
      else if (paged && (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ")) {
        e.preventDefault();
        pager.current?.next();
      } else if (e.key === "ArrowLeft") go(prev);
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
  }, [go, next, panel, paged, prev, toggleAuto, toggleTts, tts.supported]);

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
  const showBottom = chrome || playing;

  return (
    <div
      data-reader-theme={settings.theme === "auto" ? undefined : settings.theme}
      style={readerStyle(settings)}
      className="min-h-dvh bg-reader-bg text-reader-fg transition-colors"
    >
      {/* ── Top bar ── */}
      <header
        className={cn("fixed inset-x-0 top-0 z-40 border-b transition-transform duration-200", bar, !chrome && "-translate-y-full")}
        data-no-toggle
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-1 px-2">
          <Link href={`/novels/${novel.slug}`} aria-label={`Back to ${novel.title}`} className={iconBtn}>
            <ArrowLeft />
          </Link>
          <div className="min-w-0 flex-1 px-1 leading-tight">
            <p className="truncate text-sm font-semibold">{novel.title}</p>
            <p className="truncate text-xs opacity-60">
              Chapter {chapter.number}
              {chapter.title && ` · ${chapter.title}`}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleLibrary}
            disabled={libraryPending}
            aria-pressed={inLibrary}
            aria-label={inLibrary ? "Remove from library" : "Add to library"}
            className={iconBtn}
          >
            {inLibrary ? <BookmarkCheck className="text-primary" /> : <BookmarkPlus />}
          </button>
          <button type="button" onClick={() => setPanel("chapters")} aria-label="Chapters" className={iconBtn}>
            <List />
          </button>
          {isDesktop && (
            <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"} className={iconBtn}>
              {fullscreen ? <Shrink /> : <Expand />}
            </button>
          )}
          <button type="button" onClick={() => setPanel("settings")} aria-label="Reader settings" className={iconBtn}>
            <Type />
          </button>
        </div>
      </header>

      {/* ── Chapter ── */}
      {paged ? (
        <main id="main" className={settings.font === "serif" ? "font-serif" : "font-sans"} data-paragraphs={settings.paragraphs} data-justify={settings.justify}>
          <Pager
            ref={pager}
            animation={settings.pageTurn}
            initialFraction={startAtEnd ? 1 : savedPosition}
            layoutKey={`${settings.size}-${settings.leading}-${settings.width}-${settings.font}-${settings.paragraphs}-${settings.justify}`}
            onProgress={onPagerProgress}
            onToggleChrome={() => setChrome((c) => !c)}
            onBeforeStart={toPrevChapterEnd}
            onAfterEnd={afterLastPage}
            endPage={
              <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center font-sans">
                <p className="text-sm opacity-60">End of chapter {chapter.number}</p>
                {nextItem ? (
                  <button type="button" onClick={() => go(nextItem.number)} className="max-w-xs rounded-lg border border-current/15 px-5 py-4 hover:border-primary">
                    <span className="block text-xs opacity-60">Up next</span>
                    <span className="block font-medium">
                      Chapter {nextItem.number}
                      {nextItem.title && `: ${nextItem.title}`}
                    </span>
                  </button>
                ) : (
                  <p className="font-medium">You&apos;re all caught up.</p>
                )}
                <button type="button" onClick={() => setPanel("comments")} className="text-sm underline underline-offset-4 opacity-70 hover:opacity-100">
                  Read the comments
                </button>
              </div>
            }
          >
            {children}
          </Pager>
        </main>
      ) : (
        <>
          <main id="main" onClick={onPageClick} className={cn("pt-14", settings.font === "serif" ? "font-serif" : "font-sans")}>
            <div data-paragraphs={settings.paragraphs} data-justify={settings.justify}>
              {children}
            </div>
          </main>
          {footer}
          <div className="h-40" aria-hidden />
        </>
      )}

      {showResume && !paged && (
        <div className="fixed inset-x-0 bottom-32 z-40 flex justify-center px-4">
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

      {/* Quiet progress while the bars are hidden (scroll layout; paged shows page numbers) */}
      {!chrome && !playing && (settings.showChapter || (!paged && settings.showPercent)) && (
        <span className="pointer-events-none fixed right-3 bottom-2 z-30 font-sans text-xs tabular-nums opacity-45" aria-hidden>
          {settings.showChapter && `Ch. ${chapterIndex + 1}/${toc.length || 1}`}
          {settings.showChapter && !paged && settings.showPercent && " · "}
          {!paged && settings.showPercent && `${Math.round(progress * 100)}%`}
        </span>
      )}

      {/* ── Bottom bar ── */}
      <footer
        className={cn("fixed inset-x-0 bottom-0 z-40 border-t transition-transform duration-200", bar, !showBottom && "translate-y-full")}
        data-no-toggle
      >
        <div className="mx-auto max-w-3xl px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {playing && !chrome ? (
            /* Mini player while auto-scroll or read-aloud runs */
            <div className="flex h-11 items-center gap-2 text-sm">
              {auto.playing ? (
                <>
                  <span className="min-w-0 flex-1 truncate opacity-70">{paged ? "Turning pages" : settings.autoStyle === "creep" ? "Auto-scrolling" : "Page jump"}</span>
                  <button type="button" onClick={() => update({ speed: Math.max(0, settings.speed - 1) })} className={iconBtn} aria-label="Slower">
                    <Minus />
                  </button>
                  <span className="w-7 text-center text-xs tabular-nums">{settings.speed + 1}×</span>
                  <button type="button" onClick={() => update({ speed: Math.min(SCROLL_SPEEDS.length - 1, settings.speed + 1) })} className={iconBtn} aria-label="Faster">
                    <Plus />
                  </button>
                  <button type="button" onClick={() => auto.setPlaying(false)} aria-label="Pause" className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Pause className="size-4" />
                  </button>
                </>
              ) : (
                <>
                  <Headphones className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate opacity-70">Reading aloud</span>
                  {TTS_RATES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => tts.setRate(r)}
                      aria-pressed={tts.rate === r}
                      className={cn("rounded-md px-1.5 py-1 text-xs tabular-nums", tts.rate === r ? "bg-primary/15 font-medium text-primary" : "opacity-60 hover:opacity-100")}
                    >
                      {r}×
                    </button>
                  ))}
                  <button type="button" onClick={() => tts.stop()} aria-label="Stop reading aloud" className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Square className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-xs tabular-nums">
                <span className="w-9 shrink-0 opacity-60">{Math.round(progress * 100)}%</span>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={Math.round(progress * 1000)}
                  onChange={(e) => seek(Number(e.target.value) / 1000)}
                  aria-label="Position in chapter"
                  aria-valuetext={`${Math.round(progress * 100)} percent`}
                  className="reader-range min-w-0 flex-1"
                  style={{ "--fill": `${progress * 100}%` } as React.CSSProperties}
                />
                <span className="shrink-0 text-right whitespace-nowrap opacity-60">{minutesLeft ? `${minutesLeft} min left` : "Done"}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <button type="button" onClick={() => go(prev)} disabled={!prev} aria-label="Previous chapter" className={iconBtn}>
                  <ChevronLeft />
                </button>
                <button type="button" onClick={() => setPanel("chapters")} className="flex h-10 min-w-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium hover:bg-[color-mix(in_oklch,var(--reader-fg)_8%,transparent)]">
                  <span className="truncate">Ch. {chapter.number}</span>
                  <ChevronDown className="size-4 shrink-0 opacity-60" />
                </button>
                <button
                  type="button"
                  onClick={toggleAuto}
                  aria-label={auto.playing ? "Pause auto-scroll" : "Start auto-scroll"}
                  aria-pressed={auto.playing}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  {auto.playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
                </button>
                {tts.supported ? (
                  <button type="button" onClick={toggleTts} aria-label={tts.speaking ? "Stop reading aloud" : "Read aloud"} aria-pressed={tts.speaking} className={cn(iconBtn, tts.speaking && "text-primary")}>
                    <Headphones />
                  </button>
                ) : (
                  <button type="button" onClick={() => (paged ? seek(0) : window.scrollTo({ top: 0, behavior: "smooth" }))} aria-label="Back to start" className={iconBtn}>
                    <ArrowUpToLine />
                  </button>
                )}
                <button type="button" onClick={() => setPanel("settings")} aria-label="Appearance" className={iconBtn}>
                  <SlidersHorizontal />
                </button>
                <button type="button" onClick={() => go(next)} disabled={!next} aria-label="Next chapter" className={iconBtn}>
                  <ChevronRight />
                </button>
              </div>
            </>
          )}
        </div>
      </footer>

      {/* ── Panels ── */}
      {paged && (
        <Sheet open={panel === "comments"} onOpenChange={(o) => setPanel(o ? "comments" : null)}>
          <SheetContent side={sheetSide} className={cn(sheetClass, "flex flex-col overflow-y-auto")}>
            <SheetHeader>
              <SheetTitle>Chapter {chapter.number}</SheetTitle>
              <SheetDescription>{novel.title}</SheetDescription>
            </SheetHeader>
            <div className="text-foreground">{footer}</div>
          </SheetContent>
        </Sheet>
      )}
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


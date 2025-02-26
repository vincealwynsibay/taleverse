"use client";

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { useMediaQuery } from "./hooks";

export type PagerApi = {
  next: () => void;
  prev: () => void;
  goToFraction: (f: number) => void;
  reveal: (el: HTMLElement) => void;
};

type Props = {
  children: React.ReactNode;
  /** Rendered as the last page (end of chapter). */
  endPage?: React.ReactNode;
  animation: "flip" | "slide" | "none";
  initialFraction: number;
  /** Re-measure when typography changes. */
  layoutKey: string;
  onProgress: (fraction: number, page: number, total: number) => void;
  onToggleChrome: () => void;
  onBeforeStart: () => void;
  onAfterEnd: () => void;
  ref?: React.Ref<PagerApi>;
};

const GAP = 64;
const FLIP_MS = 620;
const EASE = "cubic-bezier(0.645, 0.045, 0.355, 1)";

/**
 * Book-style pages. The chapter is laid out in CSS columns exactly one
 * viewport wide; turning a page translates the column strip. The flip
 * animation clones the turning page into an overlay and rotates it on its
 * spine with moving shade, so the text underneath never re-flows.
 */
export function Pager({ children, endPage, animation, initialFraction, layoutKey, onProgress, onToggleChrome, onBeforeStart, onAfterEnd, ref }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(1);
  const busy = useRef(false);
  const pageRef = useRef(0);
  const totalRef = useRef(1);
  // Where the reader wants to be, as a fraction. Only navigation writes it, so a
  // re-layout (fonts, images, resize, settings) keeps them on the same passage.
  const desired = useRef(initialFraction);
  const pointer = useRef<{ x: number; y: number; t: number } | null>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const step = size.w + GAP;

  // ── Measure ──
  const recount = useCallback(() => {
    const v = viewport.current;
    const c = content.current;
    if (!v || !c || !v.clientWidth) return totalRef.current;
    const w = v.clientWidth;
    const t = Math.max(1, Math.round((c.scrollWidth + GAP) / (w + GAP)));
    if (t !== totalRef.current) {
      totalRef.current = t;
      setTotal(t);
      const p = Math.min(t - 1, Math.max(0, Math.round(desired.current * (t - 1))));
      pageRef.current = p;
      setPage(p);
    }
    return t;
  }, []);

  const measure = useCallback(() => {
    const v = viewport.current;
    if (!v) return;
    const w = v.clientWidth;
    const h = v.clientHeight;
    setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    // Columns settle after the new size is applied; count on the next frames.
    requestAnimationFrame(() => {
      recount();
      requestAnimationFrame(() => {
        totalRef.current = -1; // force re-apply of the desired position
        recount();
      });
    });
  }, [recount]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (viewport.current) ro.observe(viewport.current);
    document.fonts?.ready.then(measure);
    // Late-loading images change how many pages there are.
    const c = content.current;
    const onLoad = () => recount();
    c?.addEventListener("load", onLoad, true);
    window.addEventListener("load", onLoad);
    return () => {
      ro.disconnect();
      c?.removeEventListener("load", onLoad, true);
      window.removeEventListener("load", onLoad);
    };
  }, [measure, recount]);

  useEffect(() => {
    measure();
  }, [layoutKey, measure]);

  useEffect(() => {
    onProgress(total > 1 ? page / (total - 1) : 0, page, total);
  }, [page, total, onProgress]);

  // ── Turning ──
  const setPageNow = (p: number) => {
    pageRef.current = p;
    desired.current = totalRef.current > 1 ? p / (totalRef.current - 1) : 0;
    setPage(p);
  };

  const flip = useCallback(
    (from: number, to: number) => {
      const c = content.current;
      const l = layer.current;
      if (!c || !l) return setPageNow(to);
      const forward = to > from;
      // The sheet that moves: the old page when going forward, the new one going back.
      const shown = forward ? from : to;
      const sheet = document.createElement("div");
      sheet.className = "absolute inset-0 overflow-hidden bg-reader-bg";
      sheet.style.transformOrigin = "left center";
      sheet.style.backfaceVisibility = "hidden";
      sheet.style.willChange = "transform";
      const clone = c.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      clone.style.transition = "none";
      clone.style.transform = `translate3d(${-shown * step}px,0,0)`;
      const shade = document.createElement("div");
      shade.className = "absolute inset-0";
      shade.style.background = "linear-gradient(to left, rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.05) 40%, transparent 70%)";
      const spine = document.createElement("div");
      spine.className = "absolute inset-y-0 left-0 w-1/3";
      spine.style.background = "linear-gradient(to right, rgb(0 0 0 / 0.28), transparent)";
      sheet.append(clone, shade);
      l.append(spine, sheet);

      if (forward) setPageNow(to);
      const closed = "perspective(2200px) rotateY(0deg)";
      const open = "perspective(2200px) rotateY(-115deg)";
      const frames = forward ? [{ transform: closed }, { transform: open }] : [{ transform: open }, { transform: closed }];
      const shadeFrames = forward ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
      const spineFrames = forward ? [{ opacity: 0.9 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 0.9 }];
      const opts: KeyframeAnimationOptions = { duration: FLIP_MS, easing: EASE, fill: "forwards" };
      const a = sheet.animate(frames, opts);
      shade.animate(shadeFrames, opts);
      spine.animate(spineFrames, opts);
      a.finished
        .catch(() => {})
        .finally(() => {
          if (!forward) setPageNow(to);
          // Remove after the new page has painted to avoid a flash.
          requestAnimationFrame(() => {
            sheet.remove();
            spine.remove();
            busy.current = false;
          });
        });
    },
    [step],
  );

  const turn = useCallback(
    (dir: 1 | -1) => {
      if (busy.current) return;
      const t = recount();
      const from = pageRef.current;
      const to = from + dir;
      if (to < 0) return onBeforeStart();
      if (to >= t) return onAfterEnd();
      if (animation === "flip" && !reducedMotion) {
        busy.current = true;
        flip(from, to);
      } else {
        setPageNow(to);
      }
    },
    [animation, flip, onAfterEnd, onBeforeStart, recount, reducedMotion],
  );

  useImperativeHandle(
    ref,
    () => ({
      next: () => turn(1),
      prev: () => turn(-1),
      goToFraction: (f) => {
        const t = recount();
        setPageNow(Math.round(Math.min(1, Math.max(0, f)) * (t - 1)));
      },
      reveal: (el) => {
        const c = content.current;
        if (!c || !step) return;
        const offset = el.getBoundingClientRect().left - c.getBoundingClientRect().left;
        const p = Math.min(total - 1, Math.max(0, Math.floor((offset + 1) / step)));
        if (p !== pageRef.current) setPageNow(p);
      },
    }),
    [recount, step, total, turn],
  );

  // ── Input: swipe, tap zones, wheel ──
  const onPointerDown = (e: React.PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select, label, [data-no-toggle]")) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) return turn(dx < 0 ? 1 : -1);
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8 || window.getSelection()?.toString()) return;
    const x = e.clientX / window.innerWidth;
    if (x < 0.3) turn(-1);
    else if (x > 0.7) turn(1);
    else onToggleChrome();
  };

  const wheelLock = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(d) < 25 || Date.now() < wheelLock.current) return;
    wheelLock.current = Date.now() + 450;
    turn(d > 0 ? 1 : -1);
  };

  return (
    <div
      className="fixed inset-0 touch-pan-y overflow-clip pt-16 pb-12 select-text"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      <div ref={viewport} className="relative mx-auto h-full w-[calc(100vw-2rem)] max-w-[var(--reader-width)] overflow-clip">
        <div
          ref={content}
          id="pager-content"
          className="h-full [&_figure]:break-inside-avoid [&_img]:max-h-[60vh] [&>article]:!max-w-none [&>article]:!px-1 [&>article]:!pt-2 [&>article]:!pb-0"
          style={{
            columnWidth: size.w ? `${size.w}px` : undefined,
            columnGap: `${GAP}px`,
            columnFill: "auto",
            transform: `translate3d(${-page * step}px,0,0)`,
            transition: animation === "slide" && !reducedMotion ? "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
        >
          {children}
          {endPage && <div className="break-before-column">{endPage}</div>}
        </div>
        <div ref={layer} className="pointer-events-none absolute inset-0" aria-hidden />
      </div>
      <p className="pointer-events-none fixed inset-x-0 bottom-3 text-center font-sans text-xs tabular-nums opacity-50" aria-live="polite">
        {page + 1} / {total}
      </p>
    </div>
  );
}

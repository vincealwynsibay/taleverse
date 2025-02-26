"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** 0..1 position of the viewport within the chapter body. */
export function chapterFraction() {
  const el = document.getElementById("chapter-body");
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const total = rect.height - window.innerHeight * 0.6;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, -rect.top / total));
}

export function scrollToFraction(f: number, behavior: ScrollBehavior = "auto") {
  const el = document.getElementById("chapter-body");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const total = el.offsetHeight - window.innerHeight * 0.6;
  window.scrollTo({ top: top + Math.max(0, total) * f, behavior });
}

/**
 * Auto-scroll. "creep" scrolls continuously at `pxPerSecond`; "jump" moves
 * most of a screen at a time, at an interval that matches the same reading
 * speed. Stops when the reader touches the page or the chapter ends.
 */
export function useAutoScroll(pxPerSecond: number, style: "creep" | "jump", enabled = true) {
  const [playing, setPlaying] = useState(false);
  const speed = useRef(pxPerSecond);
  useEffect(() => {
    speed.current = pxPerSecond;
  }, [pxPerSecond]);

  useEffect(() => {
    if (!playing || !enabled) return;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const atEnd = () => chapterFraction() >= 0.999;

    if (style === "creep") {
      let last = performance.now();
      let carry = 0; // sub-pixel remainder so slow speeds still move
      const tick = (now: number) => {
        carry += ((now - last) / 1000) * speed.current;
        last = now;
        const step = Math.floor(carry);
        if (step >= 1) {
          carry -= step;
          window.scrollBy(0, step);
        }
        if (atEnd()) return setPlaying(false);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else {
      const jump = () => {
        const distance = window.innerHeight * 0.85;
        window.scrollBy({ top: distance, behavior: "smooth" });
        if (atEnd()) return setPlaying(false);
        timer = setTimeout(jump, (distance / speed.current) * 1000);
      };
      timer = setTimeout(jump, ((window.innerHeight * 0.85) / speed.current) * 1000);
    }

    const stop = () => setPlaying(false);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
  }, [playing, style, enabled]);

  return { playing, setPlaying, toggle: useCallback(() => setPlaying((p) => !p), []) };
}

const READABLE = "#chapter-body p, #chapter-body blockquote, #chapter-body h2, #chapter-body h3";

/**
 * Plain speech engine (no React): reads the chapter one block at a time,
 * marking and following the block being spoken.
 */
function createSpeaker(onChange: (speaking: boolean) => void) {
  let active = false;
  let rate = 1;
  let current = 0;
  const blocks = () => Array.from(document.querySelectorAll<HTMLElement>(READABLE));
  const clearMark = () => document.querySelectorAll("#chapter-body [data-speaking]").forEach((el) => el.removeAttribute("data-speaking"));

  function stop() {
    active = false;
    window.speechSynthesis.cancel();
    clearMark();
    onChange(false);
  }

  function speak(from: number) {
    const els = blocks();
    let i = from;
    while (i < els.length && !els[i].textContent?.trim()) i++;
    if (!active || i >= els.length) return stop();
    current = i;
    clearMark();
    els[i].setAttribute("data-speaking", "");
    window.dispatchEvent(new CustomEvent<HTMLElement>("reader:reveal", { detail: els[i] }));
    const u = new SpeechSynthesisUtterance(els[i].textContent!.trim());
    u.rate = rate;
    u.onend = () => active && speak(i + 1);
    u.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") stop();
    };
    window.speechSynthesis.speak(u);
  }

  return {
    start() {
      window.speechSynthesis.cancel();
      active = true;
      onChange(true);
      // Begin with the first block that's on screen.
      const first = blocks().findIndex((el) => el.getBoundingClientRect().bottom > window.innerHeight * 0.15);
      speak(Math.max(0, first));
    },
    stop,
    isActive: () => active,
    setRate(r: number) {
      rate = r;
      if (active) {
        window.speechSynthesis.cancel();
        speak(current); // restart the current block at the new rate
      }
    },
  };
}

/** Read-aloud with the browser's built-in speech synthesis. */
export function useReadAloud() {
  const supported = useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false,
  );
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRateState] = useState(1);
  const [speaker] = useState(() => (typeof window !== "undefined" && "speechSynthesis" in window ? createSpeaker(setSpeaking) : null));

  useEffect(() => () => speaker?.stop(), [speaker]);

  return {
    supported,
    speaking,
    rate,
    start: () => speaker?.start(),
    stop: () => speaker?.stop(),
    toggle: () => (speaker?.isActive() ? speaker.stop() : speaker?.start()),
    setRate: (r: number) => {
      setRateState(r);
      speaker?.setRate(r);
    },
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpenText, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { NovelCover } from "@/components/NovelCover";
import { cn, formatCompact } from "@/lib/utils";

export type SpotlightNovel = {
  id: number;
  slug: string;
  title: string;
  author: string;
  synopsis: string;
  coverUrl: string | null;
  coverHue: number;
  bannerUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  views: number;
  chapterCount: number;
  status: "ONGOING" | "COMPLETED" | "HIATUS";
  genres: { name: string; slug: string }[];
};

const INTERVAL = 7000;

/** Featured carousel: banner art, cover, blurb. Auto-advances; pauses on hover/focus; swipeable. */
export function Spotlight({ novels }: { novels: SpotlightNovel[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = novels.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured novels"
      className="relative overflow-hidden rounded-lg border bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="relative h-[340px] sm:h-[380px]">
        {novels.map((n, i) => (
          <article
            key={n.id}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${n.title}`}
            aria-hidden={i !== index}
            className={cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "pointer-events-none opacity-0")}
          >
            {n.bannerUrl ? (
              <Image src={n.bannerUrl} alt="" fill priority={i === 0} sizes="(max-width: 1200px) 100vw, 1200px" className="object-cover object-center" />
            ) : (
              <div className="absolute inset-0" style={{ background: `oklch(0.35 0.08 ${n.coverHue})` }} />
            )}
            {/* legibility: dark wash from the left and bottom */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="relative flex h-full items-end gap-6 p-5 text-white sm:items-center sm:p-8">
              <Link href={`/novels/${n.slug}`} tabIndex={i === index ? 0 : -1} className="hidden shrink-0 sm:block" aria-label={n.title}>
                <NovelCover title={n.title} author={n.author} coverUrl={n.coverUrl} hue={n.coverHue} className="w-40 shadow-2xl ring-1 ring-white/20 lg:w-44" />
              </Link>
              <div className="max-w-xl min-w-0">
                <p className="mb-2 text-xs font-medium tracking-wide text-primary uppercase">Featured</p>
                <h2 className="text-2xl leading-tight font-bold text-balance sm:text-4xl">{n.title}</h2>
                <p className="mt-1 text-sm text-white/70">{n.author}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
                  {n.ratingCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden /> {n.ratingAvg.toFixed(1)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <BookOpenText className="size-3.5" aria-hidden /> {n.chapterCount} chapters
                  </span>
                  <span>{formatCompact(n.views)} reads</span>
                  {n.genres.slice(0, 3).map((g) => (
                    <span key={g.slug} className="rounded-sm bg-white/15 px-1.5 py-0.5">
                      {g.name}
                    </span>
                  ))}
                </div>
                <p className="mt-3 line-clamp-2 max-w-lg text-sm text-white/85 sm:line-clamp-3">{n.synopsis}</p>
                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/novels/${n.slug}/1`}
                    tabIndex={i === index ? 0 : -1}
                    className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Start reading
                  </Link>
                  <Link
                    href={`/novels/${n.slug}`}
                    tabIndex={i === index ? 0 : -1}
                    className="inline-flex h-9 items-center rounded-md bg-white/15 px-4 text-sm font-medium backdrop-blur hover:bg-white/25"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {count > 1 && (
        <>
          <div className="absolute right-4 bottom-4 flex items-center gap-1.5">
            {novels.map((n, i) => (
              <button
                key={n.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${n.title}`}
                aria-current={i === index}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-primary" : "w-1.5 bg-white/50 hover:bg-white/80")}
              />
            ))}
          </div>
          <div className="absolute top-4 right-4 hidden gap-1.5 sm:flex">
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous" className="flex size-8 items-center justify-center rounded-md bg-black/40 text-white backdrop-blur hover:bg-black/60">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next" className="flex size-8 items-center justify-center rounded-md bg-black/40 text-white backdrop-blur hover:bg-black/60">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

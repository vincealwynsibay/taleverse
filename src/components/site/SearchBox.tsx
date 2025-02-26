"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { NovelCover } from "@/components/NovelCover";
import { cn } from "@/lib/utils";

type Result = { slug: string; title: string; author: string; coverUrl: string | null; coverHue: number };

/** Typeahead over titles and authors. Enter goes to the full browse results. */
export function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results);
        setActive(-1);
      } catch {
        /* aborted */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  const shown = q.trim() ? results : [];

  return (
    <div ref={wrapper} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && shown[active]) go(`/novels/${shown[active].slug}`);
          else if (q.trim()) go(`/novels?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, shown.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search titles or authors"
          aria-label="Search novels"
          role="combobox"
          aria-expanded={open && shown.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-9 w-full rounded-full border border-input bg-card/60 pr-3 pl-9 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
        />
      </form>
      {open && shown.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-md border bg-popover p-1 shadow-sm"
        >
          {shown.map((r, i) => (
            <li key={r.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <Link
                href={`/novels/${r.slug}`}
                onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 rounded-lg p-2 hover:bg-accent", i === active && "bg-accent")}
              >
                <NovelCover title={r.title} coverUrl={r.coverUrl} hue={r.coverHue} size="xs" className="w-8" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.author}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

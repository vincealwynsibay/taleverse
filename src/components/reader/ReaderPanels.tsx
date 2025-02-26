"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Headphones, LockKeyhole, MessageSquare, Search, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEADINGS, SCROLL_SPEEDS, SIZES, WIDTHS, type ReaderSettings } from "@/lib/reader-settings";

export type TocItem = { number: number; title: string; locked: boolean };

// ─── Chapter list ────────────────────────────────────────────────────────────

export function ChapterList({ slug, toc, current, onNavigate }: { slug: string; toc: TocItem[]; current: number; onNavigate: () => void }) {
  const [q, setQ] = useState("");
  const currentRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const needle = q.trim().toLowerCase();
  const items = needle ? toc.filter((c) => String(c.number).startsWith(needle) || c.title.toLowerCase().includes(needle)) : toc;
  const locked = toc.filter((c) => c.locked).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to chapter or search titles"
            aria-label="Filter chapters"
            className="h-9 w-full rounded-md border bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {toc.length} chapters{locked > 0 && ` · ${locked} in early access`}
        </p>
      </div>
      <ol className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
        {items.map((c) => {
          const isCurrent = c.number === current;
          return (
            <li key={c.number}>
              <Link
                ref={isCurrent ? currentRef : undefined}
                href={`/novels/${slug}/${c.number}`}
                onClick={onNavigate}
                aria-current={isCurrent ? "page" : undefined}
                className={cn("flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent", isCurrent && "bg-primary/10 font-medium text-primary")}
              >
                <span className={cn("w-7 shrink-0 text-right tabular-nums", !isCurrent && "text-muted-foreground")}>{c.number}</span>
                <span className="min-w-0 flex-1 truncate">{c.title || `Chapter ${c.number}`}</span>
                {c.locked && <LockKeyhole className="size-3.5 shrink-0 text-primary" aria-label="Early access" />}
                {isCurrent && <span className="shrink-0 text-xs">Reading</span>}
              </Link>
            </li>
          );
        })}
        {items.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">No chapters match.</li>}
      </ol>
    </div>
  );
}

// ─── Settings panel ──────────────────────────────────────────────────────────

type SettingsProps = {
  settings: ReaderSettings;
  update: (patch: Partial<ReaderSettings>) => void;
  chapter: { number: number; title: string };
  prev: number | null;
  next: number | null;
  onGo: (n: number | null) => void;
  onOpenChapters: () => void;
  onComments: () => void;
  auto: { playing: boolean; start: (style: "creep" | "jump") => void; stop: () => void };
  tts: { supported: boolean; speaking: boolean; toggle: () => void; rate: number; setRate: (r: number) => void };
};

export const TTS_RATES = [0.8, 1, 1.25, 1.5];

export function ReaderSettingsPanel({ settings, update, chapter, prev, next, onGo, onOpenChapters, onComments, auto, tts }: SettingsProps) {
  const autoValue = auto.playing ? settings.autoStyle : "off";
  return (
    <div className="space-y-5 overflow-y-auto px-4 pb-8">
      {/* Chapter */}
      <div className="flex items-center gap-2">
        <IconBox label="Previous chapter" onClick={() => onGo(prev)} disabled={!prev}>
          <ChevronLeft />
        </IconBox>
        <button
          type="button"
          onClick={onOpenChapters}
          className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md border bg-muted/50 px-3 text-sm hover:bg-accent"
        >
          <span className="truncate">Chapter {chapter.number}</span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>
        <IconBox label="Next chapter" onClick={() => onGo(next)} disabled={!next}>
          <ChevronRight />
        </IconBox>
      </div>
      <button type="button" onClick={onComments} className="flex h-10 w-full items-center justify-between rounded-md border bg-muted/50 px-3 text-sm hover:bg-accent">
        Comments <MessageSquare className="size-4 opacity-60" />
      </button>

      <Group label="Layout">
        <Segmented
          value={settings.layout}
          onChange={(layout) => update({ layout })}
          options={[
            { value: "scroll", label: "Scroll" },
            { value: "paged", label: "Pages" },
          ]}
        />
        {settings.layout === "paged" && (
          <Segmented
            value={settings.pageTurn}
            onChange={(pageTurn) => update({ pageTurn })}
            options={[
              { value: "flip", label: "Flip" },
              { value: "slide", label: "Slide" },
              { value: "none", label: "None" },
            ]}
          />
        )}
      </Group>

      <Group label={settings.layout === "paged" ? "Auto turn" : "Auto scroll"}>
        <Segmented
          value={autoValue}
          onChange={(v) => (v === "off" ? auto.stop() : (update({ autoStyle: v }), auto.start(v)))}
          options={[
            { value: "off", label: "Off" },
            { value: "creep", label: "Creep" },
            { value: "jump", label: "Jump" },
          ]}
        />
        <Slider
          label="Speed"
          value={settings.speed}
          max={SCROLL_SPEEDS.length - 1}
          onChange={(speed) => update({ speed })}
          format={(v) => ["Slowest", "Slow", "Medium", "Fast", "Fastest"][v]}
        />
      </Group>

      {tts.supported && (
        <Group label="Read aloud">
          <button
            type="button"
            onClick={tts.toggle}
            className={cn(
              "flex h-10 w-full items-center justify-center gap-2 rounded-md border text-sm",
              tts.speaking ? "border-primary bg-primary/10 text-primary" : "bg-muted/50 hover:bg-accent",
            )}
          >
            {tts.speaking ? <Square className="size-4" /> : <Headphones className="size-4" />}
            {tts.speaking ? "Stop reading" : "Read this chapter aloud"}
          </button>
          <Segmented
            value={String(tts.rate)}
            onChange={(v) => tts.setRate(Number(v))}
            options={TTS_RATES.map((r) => ({ value: String(r), label: `${r}×` }))}
          />
        </Group>
      )}

      <Group label="Text">
        <Slider label="Size" value={settings.size} max={SIZES.length - 1} onChange={(size) => update({ size })} format={(v) => `${Math.round(parseFloat(SIZES[v]) * 16)}px`} />
        <Slider
          label="Line spacing"
          value={settings.leading}
          max={LEADINGS.length - 1}
          onChange={(leading) => update({ leading })}
          format={(v) => String(LEADINGS[v])}
        />
        <Slider label="Page width" value={settings.width} max={WIDTHS.length - 1} onChange={(width) => update({ width })} format={(v) => ["Narrow", "Medium", "Wide"][v]} />
        <Segmented
          value={settings.font}
          onChange={(font) => update({ font })}
          options={[
            { value: "sans", label: <span className="font-sans">Geist</span> },
            { value: "serif", label: <span className="font-serif">Serif</span> },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <Segmented
            value={settings.paragraphs}
            onChange={(paragraphs) => update({ paragraphs })}
            options={[
              { value: "spaced", label: "Spaced" },
              { value: "indented", label: "Indented" },
            ]}
          />
          <Segmented
            value={settings.justify ? "justify" : "left"}
            onChange={(v) => update({ justify: v === "justify" })}
            options={[
              { value: "left", label: "Left" },
              { value: "justify", label: "Justify" },
            ]}
          />
        </div>
      </Group>

      <Group label="Theme">
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              ["auto", "Auto", "bg-gradient-to-br from-white to-slate-900"],
              ["paper", "Paper", "bg-[oklch(0.975_0.008_80)]"],
              ["sepia", "Sepia", "bg-[oklch(0.93_0.035_80)]"],
              ["night", "Night", "bg-[oklch(0.17_0.01_260)]"],
            ] as const
          ).map(([value, label, swatch]) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ theme: value })}
              aria-pressed={settings.theme === value}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-md border p-2 text-xs",
                settings.theme === value ? "border-primary ring-2 ring-primary/25" : "hover:bg-accent",
              )}
            >
              <span className={cn("size-6 rounded-full border", swatch)} />
              {label}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Progress indicator">
        <div className="grid grid-cols-2 gap-2">
          <Toggle label="Percent" checked={settings.showPercent} onChange={(showPercent) => update({ showPercent })} />
          <Toggle label="Chapter" checked={settings.showChapter} onChange={(showChapter) => update({ showChapter })} />
        </div>
      </Group>

      <Group label="Tap behavior">
        <Segmented
          value={settings.tapZones ? "zones" : "toggle"}
          onChange={(v) => update({ tapZones: v === "zones" })}
          options={[
            { value: "toggle", label: "Show controls" },
            { value: "zones", label: "Tap sides to scroll" },
          ]}
        />
      </Group>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Shortcuts: <Kbd>←</Kbd> <Kbd>→</Kbd> chapters · <Kbd>P</Kbd> auto-scroll · <Kbd>L</Kbd> read aloud · <Kbd>C</Kbd> chapter list · <Kbd>S</Kbd> settings · <Kbd>Esc</Kbd> controls
      </p>
    </div>
  );
}

// ─── Bits ────────────────────────────────────────────────────────────────────

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{label}</h3>
      {children}
    </section>
  );
}

function IconBox({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/50 hover:bg-accent disabled:opacity-40 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[] }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-md border bg-muted/50 p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2 py-1.5 text-sm transition-colors",
            value === o.value ? "bg-primary/15 font-medium text-primary ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, max, onChange, format }: { label: string; value: number; max: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <label className="block rounded-md border bg-muted/50 px-3 py-2">
      <span className="flex items-baseline justify-between text-sm">
        {label}
        <span className="text-xs text-muted-foreground tabular-nums">{format(value)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="reader-range mt-1 w-full text-foreground"
        style={{ "--fill": `${(value / max) * 100}%` } as React.CSSProperties}
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex h-10 items-center justify-between rounded-md border bg-muted/50 px-3 text-sm"
    >
      {label}
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-primary" : "bg-muted-foreground/30")}>
        <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", checked ? "left-[1.125rem]" : "left-0.5")} />
      </span>
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border bg-muted px-1 font-mono text-[0.65rem]">{children}</kbd>;
}

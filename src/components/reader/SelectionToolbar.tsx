"use client";

import { useEffect, useRef, useState } from "react";
import { BookA, Copy, LoaderCircle, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { PARAGRAPH_EVENT } from "./ParagraphBubble";

type Meaning = { partOfSpeech: string; definition: string; example?: string };
type Lookup = { word: string; phonetic?: string; meanings: Meaning[] } | { word: string; error: string };

/** Single word, letters/apostrophes/hyphens only: worth a dictionary lookup. */
const isWord = (s: string) => /^[A-Za-z][A-Za-z'’-]{0,40}$/.test(s);

async function define(word: string): Promise<Lookup> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
    if (!res.ok) return { word, error: "No definition found." };
    const data = (await res.json()) as {
      phonetic?: string;
      meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[];
    }[];
    const meanings = data
      .flatMap((e) => e.meanings)
      .slice(0, 3)
      .map((m) => ({ partOfSpeech: m.partOfSpeech, definition: m.definitions[0]?.definition ?? "", example: m.definitions[0]?.example }));
    return { word, phonetic: data.find((e) => e.phonetic)?.phonetic, meanings };
  } catch {
    return { word, error: "Couldn't reach the dictionary." };
  }
}

/**
 * Appears over a text selection inside the chapter: Define (single words),
 * Comment on the paragraph, Copy.
 */
export function SelectionToolbar() {
  const [sel, setSel] = useState<{ text: string; x: number; y: number; paragraph: number | null } | null>(null);
  const [lookup, setLookup] = useState<Lookup | "loading" | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onChange = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const s = window.getSelection();
        const text = s?.toString().trim() ?? "";
        if (!s || !text || s.rangeCount === 0) {
          // Keep an open definition while the user interacts with it.
          if (!box.current?.contains(document.activeElement)) setSel(null);
          return;
        }
        const range = s.getRangeAt(0);
        const host = (range.commonAncestorContainer instanceof Element ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement)?.closest("#chapter-body");
        if (!host) return setSel(null);
        const start = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
        const p = start?.closest<HTMLElement>("[data-p]");
        const rect = range.getBoundingClientRect();
        setLookup(null);
        setSel({ text, x: rect.left + rect.width / 2, y: rect.top, paragraph: p ? Number(p.dataset.p) : null });
      }, 220);
    };
    document.addEventListener("selectionchange", onChange);
    const hide = () => setSel(null);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      clearTimeout(t);
      document.removeEventListener("selectionchange", onChange);
      window.removeEventListener("scroll", hide);
    };
  }, []);

  if (!sel) return null;
  const word = isWord(sel.text) ? sel.text : null;
  const left = Math.min(Math.max(sel.x, 140), window.innerWidth - 140);
  const below = sel.y < 120; // not enough room above: show under the selection

  return (
    <div
      ref={box}
      data-no-toggle
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed z-50 w-[min(18rem,calc(100vw-1.5rem))] -translate-x-1/2 font-sans"
      style={{ left, top: below ? sel.y + 28 : undefined, bottom: below ? undefined : window.innerHeight - sel.y + 10 }}
    >
      <div className="overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
        <div className="flex items-center gap-0.5 p-1">
          {word && (
            <button
              type="button"
              onClick={async () => {
                setLookup("loading");
                setLookup(await define(word));
              }}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent"
            >
              <BookA className="size-4" /> Define
            </button>
          )}
          {sel.paragraph !== null && (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent<number>(PARAGRAPH_EVENT, { detail: sel.paragraph! }));
                window.getSelection()?.removeAllRanges();
                setSel(null);
              }}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent"
            >
              <MessageSquare className="size-4" /> Comment
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(sel.text);
              toast.success("Copied");
              setSel(null);
            }}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent"
          >
            <Copy className="size-4" /> Copy
          </button>
          <button type="button" onClick={() => setSel(null)} aria-label="Close" className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        {lookup && (
          <div className="max-h-60 overflow-y-auto border-t p-3 text-sm">
            {lookup === "loading" ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" /> Looking up…
              </p>
            ) : "error" in lookup ? (
              <p className="text-muted-foreground">{lookup.error}</p>
            ) : (
              <>
                <p className="font-semibold">
                  {lookup.word} {lookup.phonetic && <span className="font-normal text-muted-foreground">{lookup.phonetic}</span>}
                </p>
                <ol className="mt-2 space-y-2">
                  {lookup.meanings.map((m, i) => (
                    <li key={i}>
                      <span className="text-xs text-primary italic">{m.partOfSpeech}</span>
                      <p className="leading-snug">{m.definition}</p>
                      {m.example && <p className="mt-0.5 text-xs text-muted-foreground italic">“{m.example}”</p>}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export const PARAGRAPH_EVENT = "reader:paragraph-comments";

/** Inline count bubble at the end of a paragraph; opens that paragraph's thread. */
export function ParagraphBubble({ index, count }: { index: number; count: number }) {
  return (
    <button
      type="button"
      data-count={count}
      onClick={() => window.dispatchEvent(new CustomEvent<number>(PARAGRAPH_EVENT, { detail: index }))}
      aria-label={count ? `${count} comment${count === 1 ? "" : "s"} on this paragraph` : "Comment on this paragraph"}
      className={cn(
        "pc-bubble ml-1.5 inline-flex translate-y-[-0.1em] items-center gap-0.5 rounded-full border border-current/20 px-1.5 align-middle font-sans text-[0.68rem] leading-[1.35rem] tabular-nums transition-opacity select-none hover:border-primary hover:text-primary",
        count ? "opacity-60 hover:opacity-100" : "opacity-0 focus-visible:opacity-60",
      )}
    >
      <MessageSquare className="size-3" aria-hidden />
      {count > 0 ? count : "+"}
    </button>
  );
}
